# Fix admin sign-in, the admin dashboard, and lead notifications

## What I found (checked against the live site and database)

1. **Admin sign-in says "not configured"** — the live published build was compiled without the two browser settings it needs (the backend address and the public key). I inspected the live JavaScript: it only carries the project id, not the address or the public key. The sandbox has all three, so the live build is simply out of date. Nothing is wrong with the sign-in page itself.
2. **The enquiry form fails** — the live enquiry endpoint returns an error, and the leads table is completely empty (0 rows), so no enquiry has ever been saved. Same root cause: the live deployment is missing backend settings the server needs. The database table, its columns, the scoring, routing and email steps are all in place.
3. **Admin access** — `admin@dlxproperties.com` already exists, is confirmed, and already has the admin role. The dashboard (leads, content, market data, ad spend) is already built and lists every lead once sign-in works.
4. **Notification address** — `info@dlxproperties.com` is already saved as the notification destination, alongside the sender address and the email-sending key.

## What I will do

1. **Make the site resilient to a missing browser setting.** Instead of dying with "not configured", the browser will fall back to the backend address derived from the project id and to the public key delivered by the server when the build-time values are absent. The public key is safe to serve this way — it is the same key every visitor already downloads. This means admin sign-in cannot break again just because a build was made without those two values.
2. **Republish** so the current settings are compiled in, then verify the sign-in page renders a real email/password form rather than the notice.
3. **Verify the enquiry path end to end** — send one test enquiry, confirm it appears in the database, confirm it appears in the admin leads list, and confirm the notification reached `info@dlxproperties.com` plus a confirmation to the sender.
4. **Guarantee the notification destination.** If the send step is not receiving the address at run time, I will make `info@dlxproperties.com` the built-in fallback destination so a notification is never silently dropped, and re-deploy the email function.
5. **Report** exactly what was sent, what arrived, and anything the email provider refused.

## Technical notes

- Browser client (`src/integrations/supabase/client.ts` is generated — the fallback goes in a small wrapper/root-provided value, not in that file).
- No database migration and no schema change; the schema is already correct.
- No new secrets. Existing: `LEAD_ADMIN_EMAIL`, `LEAD_FROM_EMAIL`, `RESEND_API` (the email function already accepts that name).
- The test enquiry writes one real row; I will mark it as unqualified or delete it after verification.
