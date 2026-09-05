# Phase 2C identifier policy and pre-launch checklist

Status: implementation policy only. Exact presentation requirements must be confirmed
by DLX's qualified compliance adviser before real inventory or paid advertising launches.

## Occurrence review

| File / surface                                              | Class                           | Action           | Reason                                                                        |
| ----------------------------------------------------------- | ------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `src/config/pages.ts`, organization schema and OG generator | Editorial metadata              | Removed          | Corporate registration is not a promotional slogan.                           |
| Homepage FAQ, manifesto and proof band                      | Editorial                       | Removed          | Decorative repetition implied promotional endorsement.                        |
| Footer and contact presentation                             | Corporate                       | Removed/replaced | Generic site chrome now directs registration detail to applicable disclosure. |
| Localized home/about/footer/value copy                      | Editorial                       | Removed          | The same policy applies in every language.                                    |
| AI prompt and MCP introduction                              | Conversational                  | Removed          | The identifier is not conversational branding.                                |
| Lead, nurture and share-report branding                     | Corporate communication         | Removed          | Generic branding is not an advertising compliance block.                      |
| Generic campaign fixture and campaign footer                | Advertising-capable template    | Removed          | A future real campaign must use project-specific validated fields.            |
| `src/config/brand.ts`                                       | Internal corporate              | Retained         | Single internal source for controlled compliance use.                         |
| `src/routes/privacy.tsx`                                    | Legal/corporate disclosure      | Retained quietly | A legal contact/disclosure context, not promotional copy.                     |
| `CLAUDE.md`                                                 | Internal repository instruction | Retained         | Not an application/public surface; records the corporate fact.                |
| `CommercialProject.advertisingCompliance`                   | Advertising contract            | Added separately | Prevents ORN, BRN, permit and QR from being collapsed into one field.         |

Historical migrations were not changed.

## Real-inventory pre-launch gate

- [ ] Office registration number/ORN is current and belongs to the responsible office.
- [ ] Responsible broker BRN is current and belongs to the named broker.
- [ ] DLD advertisement permit number matches the exact advertisement.
- [ ] QR is the authority-issued asset/reference or an approved official destination.
- [ ] Responsible office and broker relationships are unambiguous.
- [ ] Required disclosure placement is confirmed for page, footer and creative.
- [ ] Permit validity and source/update timestamp have been checked.
- [ ] Compliance panel remains visible and readable on mobile.
- [ ] Brochure and share/report output reproduce the required disclosure.
- [ ] Listing email/message and campaign landing page use the same validated record.
- [ ] Social and paid creative include the required approved identifiers/assets.
- [ ] Publication validation fails closed on missing, expired or mismatched fields.
- [ ] A qualified DLX compliance adviser has signed off the exact presentation rules.
