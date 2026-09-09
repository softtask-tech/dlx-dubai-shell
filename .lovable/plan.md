# Fix admin sign-in and build out the leads dashboard

## What is actually wrong with sign-in

I found the cause in the code, and it explains exactly what you see.

The sign-in page sits *inside* the protected admin area. So when you open `/admin/login`,
the guard runs first, sees you are not signed in, and replaces the page with
"Please sign in." and a Sign in button. That button points back to `/admin/login` —
the same page — so clicking it does nothing. The email and password boxes are never
shown to you. This happens on the live site and in the preview equally, which matches
what you described.

It is not your password, not the database, and not the account: `admin@dlxproperties.com`
already exists and already has admin rights.

## The fix

1. Move the sign-in page out of the protected area so it renders on its own, keeping the
   same address `/admin/login`. You will see the email and password boxes immediately.
2. After a successful sign-in, send you straight to the leads dashboard.
3. If an account signs in without admin rights, say so clearly and offer a working sign-out.
4. Check it end to end in the preview: sign in, land on the leads list, see the leads,
   sign out, and confirm the leads that already exist are listed.

## Leads dashboard — what gets added

The dashboard already lists every lead, shows the detail panel with notes and chat
transcripts, lets you change status and assign a consultant, and exports a spreadsheet.
On top of that:

- **Date range** — from/to dates plus one-click Today, Last 7 days, Last 30 days,
  This month, All time.
- **Source and campaign** — filter by where the lead came from (contact form, listing
  enquiry, guide download, AI chat, voice call, and so on) and by ad campaign/source.
- **Budget, timeline, intent** — buy / rent / invest / relocate, how soon they plan to
  move, and a budget band.
- **Consultant and notification** — filter by who owns the lead, and show only leads
  where the notification email did not go out.
- Existing status, temperature (hot/warm/cold) and name/email/phone search stay.
- A clear "reset all filters" control and a count of what is being shown.

**Export**: the export button already produces a spreadsheet file that opens directly in
Excel, and it will respect every filter above — so you can export, for example, only hot
buy-intent leads from last month. I will add the new filter columns to the export.

## Notifications

You confirmed enquiries are saving and the emails are logging as sent. I will send one
test enquiry, confirm the row appears in the dashboard and that the notification to
`info@dlxproperties.com` and the confirmation to the sender were both accepted, then
remove the test row.

## Technical notes

- Rename `src/routes/admin/login.tsx` to `src/routes/admin_.login.tsx`. The trailing
  underscore opts the route out of the `/admin` layout while keeping the URL identical,
  so the guard no longer swallows the form.
- Extend `listLeadsFn` / `exportLeadsFn` input and `listLeads()` in `admin.server.ts`
  with `createdFrom`, `createdTo`, `sourceType`, `utmSource`, `utmCampaign`, `intent`,
  `timeline`, `budgetMin`, `budgetMax`, `assignedAgentId`, `notified`. Filtering stays
  server-side so the export matches the view.
- New filter bar component under `src/components/admin/`; `src/routes/admin/index.tsx`
  holds the filter state and passes it to both the list and the export.
- Add the new columns to `CSV_COLUMNS` in `admin.server.ts`.
- No database migration, no schema change, no new secrets — every field already exists
  on the leads table.
