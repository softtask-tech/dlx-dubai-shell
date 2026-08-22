# DLX Dubai Shell

Create the scaffold for an ultra-luxury real estate website for "DLX Properties" (a premium Dubai brokerage). This is just the foundation — I'll build features later in Claude Code.

TECH STACK

React + Vite + TypeScript + Tailwind CSS, with Supabase connected for backend/auth/database. Use Framer Motion for animation.

AESTHETIC — ultra-luxury editorial (think high-end fashion/architecture brand, NOT a typical property portal)

- Palette: monochrome base — black #000000, white #FFFFFF, slate grey #8A8A8A — with ONE warm accent: sand/gold #B08D4C and soft sand #EDE6DB. White theme. Use the accent sparingly.

- Typography: an elegant editorial serif for headings (large, refined), a clean sans-serif for body. Typography-led design.

- Feel: calm, spacious, premium. Generous whitespace, asymmetric editorial grids, full-bleed imagery. Restraint over decoration.

- Rich but tasteful motion: reveal-on-scroll, subtle fade-ins, a refined custom cursor.

BUILD THE SHELL ONLY

- A global layout with a minimal elegant header (logo placeholder "DLX", nav: Home · Properties · Services · Market Intelligence · Guides · About · Contact) and a refined footer (RERA ORN 40905, contact placeholders, social links).

- A striking Home page hero: full-bleed, a single large editorial serif headline ("Dubai real estate, handled with intention."), quiet parallax/reveal motion, sand accent used once. No search bar in the hero.

- Empty placeholder pages/routes for: Properties, Services, Market Intelligence, Guides, About, Contact.

- Set up the design system as reusable tokens (colors, typography, spacing) and a couple of base components (button, section container) so it's clean to extend.

- Custom cursor + smooth scroll globally.

Keep it clean, minimal, and beautifully styled — a strong foundation to expand. Don't build forms, listings, or complex features yet.

## Architecture

The shell above is in place. On top of it sits the foundation layer everything
later plugs into.

### One source of truth

| File | Holds |
| --- | --- |
| `src/config/brand.ts` | Brand facts — name, RERA ORN, address, contacts, socials. Import-free so build scripts can read it. |
| `src/config/pages.ts` | The page registry: path, nav label, title, description, tagline, sitemap priority. |
| `src/config/site.ts` | Re-exports both, plus `SITE_URL` and `absoluteUrl()`. Components import only this. |

**Adding a page is two steps**: create the route file, and register it in
`SITE_PAGES`. Registration is what gives it navigation, meta tags, a social
card, breadcrumbs and a sitemap entry — `pageHead()` throws if a route is
missing from the registry, so a page cannot ship without them.

### SEO / AEO

Every route builds its head through `pageHead()` (`src/lib/seo.ts`), which emits
a unique title, description, tagline, canonical URL, Open Graph and Twitter
tags, and any JSON-LD the page owns. Schema builders live in `src/lib/schema.ts`
(Organisation/RealEstateAgent, WebSite, Breadcrumb, FAQ, Article, Listing,
Review). Pages are server-rendered, so crawlers and AI read all of it without
executing JavaScript.

- `/sitemap.xml` and `/robots.txt` are generated from the registry at request
  time. `robots.txt` allows search *and* AI crawlers by name on the canonical
  origin, and serves `Disallow: /` everywhere else — preview deployments cannot
  be indexed by accident.
- Social cards live in `public/og/`. Regenerate them with `npm run og` after
  changing a page's tagline; the script renders them from the same registry, so
  a card can never disagree with the page's own meta.
- Schema only ever describes content that is visible on the page. No hidden
  keywords, no invented ratings, prices or legal claims.

### Motion and accessibility

Durations and easings come from `src/lib/motion.ts`. Everything degrades under
`prefers-reduced-motion`: reveals settle instantly, the hero parallax switches
off, and the custom cursor stays disabled so the native pointer is never hidden
(it is also off for touch and coarse pointers). The layout carries a skip link,
visible focus rings, and Escape-to-close on the mobile menu.

### Database

The schema lives in `supabase/migrations/` — nine tables in three groups:

| Group | Tables |
| --- | --- |
| Places and people | `areas`, `developers`, `agents` |
| Inventory | `projects`, `properties` |
| Content and demand | `guides`, `blog_posts`, `testimonials`, `leads` |

`leads` is the single destination for every capture surface: it carries contact
details, qualification answers (intent, timeline, budget, areas), a Hot/Warm/Cold
temperature plus a 0–100 score, pipeline status, full UTM and click-id
attribution, and the untouched `raw_payload` so nothing is lost when a form
gains a field.

Row-level security is on for every table:

- Published content (`is_published` / `is_active`) is readable by `anon`, so the
  server-rendered pages and crawlers can see it. Drafts are invisible.
- `leads` is **write-only from the outside** — anyone may insert an enquiry,
  nobody may read one back through the public API. Staff read them through the
  service role; a signed-in consultant sees and progresses only the leads
  assigned to them, via `agents.auth_user_id`.

Apply the migrations with the Supabase CLI:

```sh
npx supabase link --project-ref <project-ref>
npx supabase db push
# then regenerate the typed client:
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Lead pipeline

Every form on the site is the same component — `QualifiedForm` — in three steps:
what you want, then qualification, then how to reach you. Only a way to reply is
required; every qualification answer is optional.

A submission goes to the `submitLeadFn` server function, which:

1. re-validates the payload server-side and drops anything that filled the
   honeypot;
2. scores the lead 0–100 and derives Hot/Warm/Cold (`src/data/lead-scoring.ts`) —
   **on the server**, so a visitor cannot post themselves a score;
3. writes a `leads` row with its source type, UTM/click-id attribution and the
   scoring rationale; and
4. invokes the `send-lead-emails` Edge Function, which sends the admin
   notification and the client confirmation through Resend.

Email failure never fails a submission. The enquiry is already saved, and the
inbox surfaces any lead whose notification did not go out.

### Admin

`/admin` is protected twice over. The browser gate hides the UI without a
session; the gate that matters is server-side — every admin server function
re-verifies the access token against Supabase Auth and checks the `admin` role
before it touches anything. The whole area is `noindex`.

Grant someone admin access (there is no self-service sign-up):

```sql
-- after creating the user in Supabase Auth
insert into user_roles (user_id, role)
values ('<auth-user-uuid>', 'admin');
```

The admin app has two surfaces: a **leads inbox** (filter by status,
temperature or search; tag, assign, add notes, export CSV) and a **content
editor** with CRUD for properties, developers, projects, team and testimonials.
Both read through `CONTENT_SCHEMA` in `src/data/content-schema.ts`, which is
simultaneously the form definition and the server's write allow-list — a column
the editor does not show is a column the server will not write.

### When the database is not there

Public list queries degrade rather than fail (`src/data/resilience.ts`): if
Supabase is unreachable or the migrations have not been applied, the pages
render their empty states — "the portfolio is being prepared" — and log the
failure with a `[data:…]` prefix. The lead pipeline and the admin app
deliberately do **not** degrade: a failure to save an enquiry has to be loud.

## Environment variables

Copy `.env.example` to `.env`. Every variable is documented there.

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin for this deployment. Drives canonical URLs, `og:url`, JSON-LD IDs, the sitemap, and whether `robots.txt` allows indexing. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PROJECT_ID` | Browser-side Supabase client. |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PROJECT_ID` | Server-side Supabase access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — writes leads and powers the admin app. Bypasses RLS, so never expose it to the browser. |

Edge Function secrets (`npx supabase secrets set …`, not `.env`):

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends both lead emails. Without it the function logs and skips; enquiries are still saved. |
| `LEAD_FROM_EMAIL` | Verified Resend sender. |
| `LEAD_ADMIN_EMAIL` | Where notifications land. Comma-separated for several. |
| `SITE_DOMAIN`, `BRAND_PHONE` | Used in the email templates. |

## Commands

```sh
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint + prettier
npm run typecheck  # tsc --noEmit
npm run og         # regenerate the Open Graph cards in public/og/
```

`npm run og` drives a headless Chromium and fetches the brand fonts once, so it
needs a Chrome/Chromium binary (set `CHROMIUM_PATH` if it is not auto-detected)
and network access. The generated PNGs are committed, so serving them needs
neither at runtime.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/619b8eaa-77b2-42a9-b174-4086d6ff1e6d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
