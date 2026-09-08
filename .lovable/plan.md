# Go-live configuration check for DLX Properties

I checked the live setup before planning. Most of the list is already done — only one item genuinely remains.

## What is already in place

- **Backend keys for the website and the server** — the project's address key, the public browsing key and the private server key are all already supplied by Lovable Cloud to both the browser build and the server. Nothing to add; they are managed automatically and must not be duplicated by hand.
- **Lead notification address** — `LEAD_ADMIN_EMAIL` is already saved, so enquiry notifications have a destination.
- **Email sending key** — already saved (stored under the name `RESEND_API`, which the email functions already accept).
- **The off-plan split migration** — already applied. Both read-only functions (`get_dld_offplan_split`, `get_dld_offplan_split_period`) exist in the live database, and there are no other unapplied migrations.
- **Code** — GitHub sync is automatic in Lovable, so the merged branch is already in this project. No code changes are needed or planned.

## What is missing

There is **no login account at all** on the project yet — the accounts table is empty. So the admin dashboard cannot be signed into, and the role-granting SQL you supplied matches zero rows today.

## The one step to take

1. Create the admin account for `info@dlxproperties.com`, confirmed immediately so it does not wait on a verification email.
2. Grant it the `admin` role with exactly the statement you provided (safe to re-run).
3. Confirm the role row exists, then you sign in at `/admin/login` and see the leads list.

## What I need from you

A password for `info@dlxproperties.com`. Send it in a normal message and I'll use it once to create the account, or say "generate one" and I'll create a strong password and show it to you so you can change it after first sign-in.

## Optional check afterwards

Submit the form on `/contact` with your own address to confirm the notification and the confirmation email both arrive.

## Technical notes

- No application code, no new migration, no new secrets.
- Account creation uses the Auth Admin API with `email_confirm: true`; the role insert is your exact SQL against `public.user_roles`.
