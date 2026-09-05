# Future commercial project schema proposal

Status: **unapplied design proposal**. No Supabase migration accompanies Phase 2B.
Revise this model only after the real inventory folder, its media rights and its
source identifiers have been audited.

## Current gaps

The existing curated `projects` table supports a name, developer/community links,
summary, description, hero/gallery URLs, one starting price, unit types, bedroom
bounds, a handover quarter/year, free-text payment plan, amenities, one brochure,
one floor-plan URL, and publication flags. It cannot faithfully represent:

- ordered payment-plan stages and their trigger/date basis;
- multiple floor plans and the unit types/stacks they belong to;
- bedroom, internal-area and plot-area ranges by unit type;
- service-charge values with basis, effective date and provenance;
- structured investment considerations without turning editorial copy into fact;
- a rights-audited media gallery with roles, captions and ordering;
- brochure versions and source timestamps;
- construction progress observations and their source date;
- an assigned consultant independent of individual property inventory;
- a public, nullable link to the official DLD project record;
- real/demo/publication state as separate concerns;
- inventory availability and the timestamp/source that supports it.

The current lead table links directly to a property, not a commercial project. A
future change should add a nullable commercial-project relationship rather than
putting project identity into free text alone.

## Proposed entities

### `commercial_projects`

Stable UUID and slug; names; developer/community links; publication state
(`draft`, `private`, `public`, `archived`); content origin (`real`, `demo`);
commercial status; currency; handover range; construction status/progress;
assigned consultant; nullable official DLD directory project ID; `available_as_of`,
`source_updated_at`, editorial timestamps and source/provenance notes.

Advertising compliance is a separate validated object, never one generic licence:
`office_registration_number`, `responsible_broker_brn`,
`advertisement_permit_number`, `authority_issued_qr_asset_or_reference`,
`permit_valid_to`, `compliance_source_updated_at`, and `validation_status`.
Publication of an advertising page must fail closed unless the fields required for
that advertisement have passed validation. The QR value must be an authority-issued
asset or approved official verification destination, never a locally generated code.

Public policies must require `content_origin = 'real'` and
`publication_state = 'public'`. A demo row must never satisfy public RLS even if a
publication flag is set incorrectly.

### `commercial_project_unit_ranges`

Project, property type, bedroom minimum/maximum, internal-area minimum/maximum,
plot-area minimum/maximum, price minimum, currency, availability state,
availability count when supplied, source and `available_as_of`.

### `commercial_project_payment_stages`

Project, display order, percentage, trigger type, milestone/date, label, notes,
source and effective date. Percentages should be validated as non-negative and a
complete plan should total 100 only when the source describes a complete plan.

### `commercial_project_floor_plans`

Project, unit-range link, title, media URL, file type, accessible description,
display order, source and rights record. Never infer dimensions from an image.

### `commercial_project_media`

Project, role (`hero`, `gallery`, `location`, `amenity`, `construction`), URL,
responsive derivatives, alt text, caption, display order, rights status, source,
captured date and whether the image is illustrative.

### `commercial_project_documents`

Project, kind (`brochure`, `payment_plan`, `fact_sheet`), title, URL, version,
language, published/source timestamps and rights/source metadata.

### `commercial_project_cost_notes`

Project, cost type, amount/range, unit basis, currency, effective date, source and
plain-language caveat. Service charges must never be presented without a basis and
date.

### `commercial_project_considerations`

Project, category, evidence-backed observation, display order, source references,
editorial reviewer and review date. This is editorial DLX content and must be
visually separate from official DLD fields.

### Lead and inventory relationships

Add a nullable `commercial_project_id` to leads, and preserve selected action and
user intent in qualification data. Add unit/property relationships only after the
inventory source is understood. Demo submissions should use a separate no-write
path, not a database flag on a normal production lead.

## Publication and canonical rules

- `/off-plan/$slug` is the canonical commercial project URL.
- `/directory/projects/$slug` remains the canonical official DLD record URL.
- `/projects/$slug` remains unchanged in Phase 2B. Before real inventory launches,
  create an explicit legacy slug map: aliases must either 301 to `/off-plan/$slug`
  or canonicalize there; never publish both as independent indexable pages.
- Commercial-to-DLD links are nullable and deterministic. Do not infer them from
  names.
- Availability, price, payment, construction and handover facts require source
  and observation timestamps.
