# Fix enquiries not reaching the admin inbox, then tidy the whole enquiry flow

## What I found

The leads table holds exactly **one** row — a diagnostic test from 9 September. Nothing
from your contact-page test on `admin@enimpolix.com` was ever saved, which matches "success
message, no email". So the problem is not the dashboard: the enquiry never became a lead.

Two silent-success paths in the contact form can swallow a submission without a trace:

1. **The hidden anti-bot field.** The contact form carries an off-screen box labelled
   "Company". If a browser or password manager autofills it — Chrome regularly does, even
   though the field asks it not to — the submission is treated as a bot, the visitor is shown
   success, and nothing is written. This is the most likely cause of your test vanishing.
2. **The repeat-submission guard.** The same email from the same form inside 6 hours is
   answered with success and written nowhere.

Both are deliberate, but today neither leaves any record, so a real enquiry can disappear
with nobody knowing. The fix is to keep the protection and stop the silence.

## What I will do

**1. Confirm the cause before changing anything.** Send a test enquiry through the live
contact form in a real browser and watch exactly which path it takes. If it is something
other than the two above, I will tell you and adjust.

**2. Never lose an enquiry silently again.**
- Suspected-bot and repeat submissions are still saved, marked, and kept out of the working
  list — visible in the inbox under a "blocked / duplicate" filter instead of vanishing.
- The hidden field gets a name browsers do not recognise and is made un-autofillable, so
  genuine visitors stop tripping it.
- Any failure to save now shows the visitor a clear error instead of a success message.

**3. Rate limit — balanced.** Roughly 3 enquiries per 10 minutes and 10 per day from the
same visitor. Over the limit, the person sees a polite "we already have your enquiry, we'll
be in touch" rather than an error, and the attempt is recorded so you can see it.

**4. Make every form consistent.** The contact form, consultant enquiry, brochure request
and private-inventory form all go through the same path today but differ in detail. I will
give them all the same protections, the same error handling, the same required-field rules
(name plus one contactable detail), and the same honest confirmation.

**5. Show the origin form in the admin inbox.** A new "Form" column naming exactly where it
came from (Contact page, Azizi Florence brochure, consultant profile, AI chat, and so on),
plus a filter on it and a column in the Excel export.

**6. End-to-end check.** Submit through each form, confirm each one lands in the inbox with
the right origin and that the notification to `info@dlxproperties.com` and the visitor's
confirmation are both accepted, then remove the test rows.

## Why no email arrived

No lead was created, so no email was ever requested. Once the enquiry saves, the existing
notification path runs. I will re-verify the email delivery on the test enquiry and report
back if anything else is wrong there.

## Technical notes

- `src/data/leads.server.ts`: honeypot and duplicate branches stop returning a fake success
  with a zero UUID; they insert with `status = 'unqualified'` and a spam reason
  (`honeypot`, `duplicate_within_window`). Insert errors keep throwing so the UI shows them.
- Rate limit: new `public.lead_rate_limits` table keyed on a hashed IP + coarse window, with
  GRANTs, RLS enabled and no public policies (service-role only). Checked in
  `spam.server.ts` before the insert; the IP comes from `getRequestHeader` inside the server
  function. Add `ip_hash` to `leads` for traceability.
- `src/components/forms/qualified-form.tsx`: rename the honeypot input to a neutral name,
  add `autoComplete="new-password"` plus `readOnly`-until-focus so autofill cannot populate
  it; treat a non-empty value as suspicious rather than as an instant silent drop.
- Align `consultant-enquiry.tsx`, `brochure-request.tsx`, `private-inventory-form.tsx` on the
  same submit/error handling and the same honeypot.
- `admin.server.ts` / `lead-filters.tsx` / `admin/index.tsx`: surface `source_detail` as a
  human-readable "Form" label, add a filter and a CSV column, plus a
  "blocked / duplicate" status filter.
- One migration only (rate-limit table + `leads.ip_hash`). No new secrets.
