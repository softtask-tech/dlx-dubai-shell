# Bring the backend in line with the code

## Current state (verified)

- The repo is up to date at "Phase 2: core pages, lead pipeline, admin inbox and content CRUD".
- The database is **completely empty** — zero tables in `public`. All five SQL files in `supabase/migrations/` were written in Claude Code and never applied here.
- None of the migration files contain permission grants, so even after applying them the app could not read or write anything.
- Storage buckets are declared with raw SQL (`insert into storage.buckets`), which is rejected by this platform — buckets must be created through the bucket tool instead.
- The lead email function (`send-lead-emails`) exists in the repo but is not deployed, and its keys are not configured.
- The generated types file is still empty, which is why `src/data/database.ts` exists as a hand-written stand-in.

## What I'll do

1. **Apply the schema.** One migration combining the five files in order: core tables (areas, developers, agents, projects, properties, testimonials, leads, lead notes), row-level security, admin roles with the `has_role` helper, and the later listing/collateral columns.
2. **Add the missing permissions.** Public read access for published content, signed-in access for admin work, full access for server-side code — added for every table so the site actually loads data.
3. **Create the media buckets** (`property-media`, `brochures`, `team`) properly, with the same access rules the SQL intended: public read, admin-only upload and delete.
4. **Deploy the lead email function** and note which keys it still needs (Resend key, sender address, admin recipient). Without them it stays in safe no-op mode rather than breaking submissions.
5. **Refresh generated types** after the migration and, if they come through complete, retire the hand-written `src/data/database.ts` stand-in so queries type against the real schema.
6. **Verify** — load the home, properties, services and admin routes and confirm data reads succeed with no console or server errors.

## Notes

- No new features and no design changes; this is purely getting the existing code running against a live backend.
- Storage bucket SQL will be dropped from the combined migration (the tool handles it); the policies on `storage.objects` stay in SQL.
- The admin area needs an account with the `admin` role. After the migration I'll tell you how to grant it to your sign-in.
- Empty tables mean listings pages render their empty states until content is added.
