# Turning on leads, admin and the voice agent

Everything below is **already built**. None of it needs code. What each part
needs is a secret set in Lovable, or one row in the database, and this is the
exact list.

Ordered by what a client review will notice first.

---

## 1. Lead notifications to info@dlxproperties.com

The pipeline is complete: every form, the chat and the voice agent all write a
lead through `submitLead()`, which invokes the `send-lead-emails` Edge
Function, which sends two emails — one to you, one confirming to the person who
enquired.

It is not sending because it does not know where to send.

| Secret | Value | Why |
| --- | --- | --- |
| `LEAD_ADMIN_EMAIL` | `info@dlxproperties.com` | **The missing one.** Where notifications land. Comma-separate for several. |
| `RESEND_API_KEY` | your Resend key | You have set this. `RESEND_API` is also read, as a fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase settings | The lead write and the function invoke both need it. |

Without `LEAD_ADMIN_EMAIL` the function records the lead and returns
`"LEAD_ADMIN_EMAIL unset"`, so **leads are being saved, they are just not being
announced.** Any enquiry made before you set this is still in the database and
will show up in the admin dashboard.

**Check it worked:** submit the form on `/contact` with your own address. You
should get the notification, and the address you used should get a
confirmation. If neither arrives but the lead appears in the dashboard, it is
Resend, not the site.

---

## 2. The admin dashboard and login

Built, at `/admin`, with `/admin/login`. Leads, content, DLD data and ad
performance. There is deliberately **no sign-up**: accounts are made by hand,
because a public sign-up form on an admin panel is a public admin panel.

Two steps, both in Supabase.

**Create the user.** Authentication → Users → Add user. Give it an email and a
password, and tick "auto confirm" so it does not wait on an email.

**Give it the admin role.** The login itself is not enough: every admin server
function re-checks the role before it reads anything, so a user without a role
signs in and sees nothing. In the SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'info@dlxproperties.com'
on conflict (user_id, role) do nothing;
```

`app_role` is an enum of exactly `'admin'` and `'agent'`. Only `'admin'`
reaches the dashboard.

**Check it worked:** sign in at `/admin/login`. You should land on the leads
list. If you sign in and the tables are empty while the database has rows, the
role row is missing.

---

## 3. The voice agent

Covered in full in `FISH-AUDIO.md` section 9. In short:

```bash
export FISH_API=...             # already in Lovable
export FISH_WEBHOOK_SECRET=...  # any long random string, add it to Lovable too

node scripts/fish-agent.mjs --voices   # pick a voice
node scripts/fish-agent.mjs            # build the draft
node scripts/fish-agent.mjs --publish  # make it live
```

Then set `FISH_AGENT_ID` to the id it prints. The talk button in the advisor
only appears once that is set, so an offer to talk can never be one that cannot
connect.

---

## 4. The browser Supabase keys

The console on the live site reports:

```
[Supabase] Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.
```

The **server** has its credentials, which is why the pages render and
`/data/market.json` works. The **browser bundle** does not, because those are
read at build time under different names:

| Secret | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | the same URL the server uses |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the publishable (anon) key, not the service role key |

Never put the service role key in a `VITE_` variable. Anything prefixed `VITE_`
is compiled into the JavaScript every visitor downloads.

---

## 5. The tables that are empty

Not a configuration problem, and not something to fix by writing code. These
four have no rows:

| Table | What it feeds |
| --- | --- |
| `areas` / `area_market_stats` | the curated community guides |
| `properties` | the portfolio |
| `developers` | developer profiles |
| `blog_posts` | the journal |

Two of those pages now answer from the Dubai Land Department registry instead
of apologising: `/areas` lists the 153 communities that have published figures,
and `/developers` lists the official developer register. That is real data and
it holds up in a review.

The other two are honest about being empty, and neither says anything is
"loading", because nothing is.

What is populated and working: `dld_market_aggregates` (the market pages, the
community pages, the calculators and the advisor's knowledge), the DLD
directory, and `agents` (the team pages).
