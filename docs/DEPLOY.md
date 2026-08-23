# Deploying DLX Properties

Everything needed to put this build on SOFT TASK's server, and the reasoning
behind the parts that are easy to get wrong.

Run `npm run preflight` before every deploy. It reads `.env` and the process
environment, lists what is missing and what each gap actually costs, and exits
non-zero when something the site cannot work without is absent.

---

## 1. What the build produces

```bash
npm ci
npm run build
```

Two directories come out of `.output`:

| Path              | What it is                                                     |
| ----------------- | -------------------------------------------------------------- |
| `.output/public/` | Static assets. Content-hashed, immutable, safe behind any CDN. |
| `.output/server/` | The SSR server. Every page is rendered here, on request.       |

**The site cannot be deployed as static files.** Listings, market figures and
the advisor's availability are read per request, and the SEO rules in
`CLAUDE.md` require crawlers to receive complete HTML without executing
JavaScript. A static export would serve an empty portfolio.

### A note on the build target

`@lovable.dev/vite-tanstack-config` configures nitro with **Cloudflare Workers**
as its default target. That is why `npx vite preview` fails locally: it looks
for `dist/server/server.js` and nitro wrote `.output/server/`. Do not read that
failure as a broken build.

For a self-managed Node server, set the nitro preset before building:

```bash
NITRO_PRESET=node-server npm run build
node .output/server/index.mjs      # listens on PORT, default 3000
```

Confirm the preset took effect by checking that `.output/server/index.mjs`
starts a listener rather than exporting a Workers `fetch` handler — a Workers
build exits silently when run under Node, which looks exactly like a crash.

---

## 2. Environment

Set these on the server, not in the repository. `VITE_`-prefixed variables are
**inlined into the client bundle at build time**, so they must be present when
`npm run build` runs and must never hold a secret. Everything else is read at
runtime by the server.

`npm run preflight` enumerates all twenty with the cost of each omission. The
four the site genuinely cannot run without:

```
VITE_SITE_URL                   https://dlxproperties.ae   (no trailing slash)
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
LEAD_ADMIN_EMAIL
```

`VITE_SITE_URL` deserves particular care: it is the origin every canonical tag,
`hreflang` alternate, sitemap entry and Open Graph image URL is built from. Set
wrongly, the site tells Google that the canonical version of every page lives
somewhere else.

---

## 3. Reverse proxy

`public/_headers` carries the cache policy for Cloudflare Pages and Netlify.
Behind nginx or Caddy the same three rules have to be stated in the server
config, because those platforms do not read that file.

### nginx

```nginx
server {
  listen 443 ssl http2;
  server_name dlxproperties.ae;

  # Hashed assets are immutable by construction: change the file and the
  # filename changes with it. There is no scenario in which a stale one is
  # served, so a year is correct.
  location /assets/ {
    alias /srv/dlx/.output/public/assets/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
  }

  # Social cards and the hero photograph: stable, but not content-hashed.
  location ~ ^/(og|favicon\.png) {
    root /srv/dlx/.output/public;
    add_header Cache-Control "public, max-age=604800, must-revalidate";
  }

  # Everything else is server-rendered HTML carrying live listing and market
  # data, and varies by the visitor's consent and currency. A shared proxy must
  # never hold it: a page cached for one visitor and served to another is the
  # failure that makes a personalised site look broken.
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Currency detection reads this. Without a country header from the edge
    # every visitor is priced in dirhams — correct, but the empathy is lost.
    proxy_set_header CF-IPCountry $http_cf_ipcountry;

    add_header Cache-Control "public, max-age=0, must-revalidate";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
  }
}
```

### Country detection

`src/data/geo.functions.ts` reads the first of `cf-ipcountry`,
`x-vercel-ip-country`, `x-nf-geo-country`, `fastly-client-country-code`,
`x-appengine-country` or `x-dlx-country`. Whatever sits in front of the app must
forward one of them, or every visitor sees dirhams only.

`x-dlx-country` exists for testing. To see exactly what a visitor from Karachi
sees:

```bash
curl -H "x-dlx-country: PK" https://dlxproperties.ae/
```

---

## 4. Supabase

```bash
supabase link --project-ref <ref>
supabase db push                       # applies every file in supabase/migrations
supabase functions deploy send-lead-emails
supabase functions deploy sync-dld-data
supabase functions deploy advisor-call-summary
supabase functions deploy lead-nurture
```

Then set the function secrets (`supabase secrets set NAME=value`): `RESEND_API_KEY`,
`LEAD_ADMIN_EMAIL`, `VOICE_WEBHOOK_SECRET`, `NURTURE_SECRET`, `SITE_URL`.

`20260823010100_schedule_nurture.sql` schedules the nurture run through pg_cron.
Enable the extension in the Supabase dashboard first; the migration fails
without it and that failure is easy to miss in a batch push.

---

## 5. After the first deploy

```bash
npm run preflight -- --url https://dlxproperties.ae
```

Seven requests that answer the only question worth asking straight after a
deploy: is it up, is it the right build, and do the routes that earn money
respond. It checks the homepage renders, that `/ar` comes back
`dir="rtl"`, that the sitemap and robots files are correct for a production
origin, and that an unknown path returns a real 404 rather than a soft 200.

### Then, by hand

1. **Submit the sitemap.** `https://dlxproperties.ae/sitemap.xml` to
   [Google Search Console](https://search.google.com/search-console) and
   [Bing Webmaster Tools](https://www.bing.com/webmasters). In Search Console,
   check the International Targeting report a few days later: it is the only
   place a broken `hreflang` reciprocity error shows up.
2. **Validate the structured data.** Paste the homepage, a listing, a guide and
   `/ar` into the [Rich Results Test](https://search.google.com/test/rich-results).
   `npm run audit:seo` checks that JSON-LD exists and is well-formed; only
   Google will tell you whether it qualifies for a rich result.
3. **Send one real lead** through `/contact` and confirm both emails arrive and
   the lead appears in `/admin` with a score, a temperature and an assigned
   consultant.
4. **Watch the error log** for the first hour. Server errors are captured by
   `src/lib/error-capture.ts`; unhandled render errors reach the root error
   boundary, which reports through `src/lib/lovable-error-reporting.ts`.

---

## 6. Rolling back

The build is a directory. Keep the previous one:

```bash
mv /srv/dlx/current /srv/dlx/previous-$(date +%s)
mv /srv/dlx/incoming /srv/dlx/current
systemctl restart dlx
```

Database migrations are the part that does not roll back cleanly. Every
migration in this repository is additive — new tables, new nullable columns,
new policies — so an older build runs against a newer schema without error.
Keep it that way: a migration that drops or renames a column turns a rollback
into an outage.
