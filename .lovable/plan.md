# Fix the confirmation email: real contact details and a proper enquiry summary

## What's wrong today

The confirmation email you received shows:
- Phone `+971 (0) 000 0000` — a placeholder, because the email code has its own copy of the contact details instead of using the site's.
- Address `Business Bay, Dubai` — also outdated in the email footer.
- Under "What you told us" it only repeats the free-text message (`TEST`). It doesn't say whether they want to buy, rent or invest, their timeline, or their budget.

## The changes

### 1. Correct contact details
Use the site's real details everywhere in both emails:
- Phone: +971 54 599 6911
- Address: S210, Property Investment Office 4 S1, Dubai Investment Park First, Dubai, UAE
- Email: info@dlxproperties.com

These will be read from the single place the rest of the site already uses, so they can never drift apart again.

### 2. "What you told us" becomes a real summary
Replace the single message block with a short, elegant list of everything the enquirer actually gave, in the same editorial style:

```text
WHAT YOU TOLD US

Looking to        Buy
Timeline          Within 3 months
Budget            AED 1,500,000 - 2,500,000
Preferred contact WhatsApp
Areas             Dubai Marina, Downtown

Your message
TEST
```

Rules:
- Only lines the person actually filled in are shown — nothing blank, no "-" placeholders.
- Values are written in plain English ("Within 3 months", not `within_3_months`).
- Budget formatted with currency and thousands separators.
- The free-text message keeps its sand-tinted block underneath.
- If they gave nothing but a message, the email looks exactly as it does now.
- If they gave no message at all, the section still shows their choices.

The internal notification email to info@dlxproperties.com keeps its full detail table and just gets the corrected footer/phone.

## Technical notes

- `supabase/functions/send-lead-emails/templates.ts` — extend `clientConfirmationEmail` to render the qualification rows (intent, timeline, budget, preferred contact, property types, bedrooms, areas where present) using the existing `humanise`/`formatBudget` helpers; update `footer()` to the full address.
- `supabase/functions/send-lead-emails/index.ts` — set `BRAND.phone` default to the real number and pass the address through, keeping env overrides.
- Pass any extra lead fields the client email needs (preferred contact, property types, bedrooms) into `LeadEmailData` from the lead row.
- Redeploy the function and send one live test enquiry through the contact form to confirm both emails, then remove the test lead.
