# Finish the go-live fixes and stop pages failing on first load

## Where the first two issues stand

- **Enquiry form and notifications: proven working.** I sent a real test enquiry through the site. It was saved, scored, routed, and both emails were recorded as sent — the team notification to `info@dlxproperties.com` and the confirmation to the sender. I also made that notification address the built-in fallback in the email step, so a missing setting can never silently swallow a lead, and re-deployed it.
- **Admin sign-in: fixed in the code, not yet live.** The browser build was being compiled without the backend address and public key. It now falls back to the server-side values (and to the address derived from the project id) so it cannot happen again. The preview no longer shows the "not switched on" notice. The publish I started is still serving the previous build, so the live site has not picked it up yet.
- `admin@dlxproperties.com` already has admin access, and the dashboard lists every lead once sign-in works.

## The new issue: pages failing on first visit, fine after a refresh

Confirmed cause. The data-heavy pages (home, Market Intelligence, directory, areas) fetch their figures before rendering — Market Intelligence alone makes seven parallel requests. They are all-or-nothing: if a single one hiccups (a cold server, a dropped connection, a slow first request after a deploy), the whole page reports a load failure. A refresh works because the second attempt succeeds. There is one error screen for the entire app and it has no automatic retry, so every hiccup becomes a dead end for the visitor.

## What I will do

1. **Retry instead of failing.** A failed page load will retry automatically once or twice, with a brief pause, before it ever shows an error. Most hiccups will disappear before the visitor notices.
2. **Stop one missing figure from taking down a page.** On the data pages, each read gets its own fallback: if one section's numbers do not arrive, that section shows its "data unavailable" state and the rest of the page renders normally, instead of the whole page erroring.
3. **A friendlier error screen with a "Try again" button** that reloads just the data rather than the whole site, so a visitor is never stuck.
4. **Re-publish and verify on the live site**: admin sign-in shows a real email/password form; a live test enquiry appears in the admin leads list; the notification arrives at `info@dlxproperties.com`.
5. **Clean up** the test enquiries so the leads list starts empty.

## Technical notes

- Router defaults gain a retry on loader failure; `__root.tsx`'s error component gains a retry action.
- Loaders on the data routes move from `Promise.all` to a tolerant per-read wrapper returning the existing empty/fallback shape, so section-level "no data" states already in the components do the work.
- No database migration, no schema change, no new secrets.
- Unrelated: the security scan reports one Security Definer View finding; I will report it, not change it, unless you ask.
