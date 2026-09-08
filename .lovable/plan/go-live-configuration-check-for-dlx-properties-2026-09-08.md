# Go-live configuration check for DLX Properties

I checked the live setup before planning. Most of the list is already done — only one item genuinely remains.

## What is already in place

- **Backend keys for the website and the server** — the project's address key, the public browsing key and the private server key are all already supplied by Lovable Cloud to both the browser build and the server. Nothing to add; they are managed automatically and must not be duplicated by hand.
- **Lead notification address** — `LEAD_ADMIN_EMAIL` is already saved, so enquiry notifications have a destination.
- **Email sending key** — already saved (stored under the name `RESEND_API`, which the email functions already accept).
- **The off-plan split migration** — already applied. Both read-only functions (`get_dld_offplan_split`, `get_dld_offplan_split_period`) exist in the live database, and there are no other unapplied migrations.
- **Code** — GitHub sync is automatic in Lovable, so the merged branch is already in this project. No code changes are needed or planned.

## What is missing

The only account on the project is **admin@dlxproperties.com** (already created and confirmed), and it has no admin role yet — so it can sign in but the dashboard shows nothing. Note there is no `info@dlxproperties.com` account, so the SQL you pasted would match zero rows; I'll grant the role to the account that actually exists.

## The one step to take

1. Grant the `admin` role to `admin@dlxproperties.com` — the same statement you supplied, with the email changed to the account that exists, and still safe to re-run.
2. Confirm the role row is there.
3. You sign in at `/admin/login` and land on the leads list.

Lead notifications will still go to `info@dlxproperties.com`; that is a separate setting and already correct.

## Optional check afterwards

Submit the form on `/contact` with your own address to confirm the notification and the confirmation email both arrive.

## Technical notes

- No application code, no new migration, no new secrets.
- `insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'admin@dlxproperties.com' on conflict (user_id, role) do nothing;`
