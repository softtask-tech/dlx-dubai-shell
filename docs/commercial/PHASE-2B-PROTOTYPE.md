# Phase 2B commercial property foundation

Phase 2B keeps its three fictional projects in typed local fixtures. It does not
insert them into Supabase, connect them to official DLD records, include their
slugs in the sitemap, emit property/offer structured data, or create production
enquiries.

## Environment boundary

`VITE_ENABLE_DEMO_PROJECTS=true` is necessary but not sufficient. The centralized
server-side gate permits only localhost and the approved Lovable preview suffixes
`.lovable.app` and `.lovableproject.com`. `dlxproperties.com` and
`www.dlxproperties.com` are explicitly denied even if the flag is true. A missing
request context also denies access.

Production renders an honest private-inventory state and a real requirement form.
Preview renders the three concepts and mounts only a local state demonstration
form. The demo form imports no lead function, database client, analytics tracker,
advertising integration, email system or WhatsApp action.

## Content and route boundary

- `/off-plan` is the commercial discovery route.
- `/off-plan/$slug` is reserved for stable commercial-project URLs.
- `/projects/$slug` is unchanged.
- `/directory/projects/$slug` remains the official DLD record route.
- Mock detail pages always emit `noindex, nofollow` and no real-estate entity or
  offer schema.
- Only the `/off-plan` landing page is eligible for the static sitemap. Fixture
  slugs are absent from every sitemap and AI knowledge source.

The generated architecture is illustrative, labelled in visible copy and alt text,
and deliberately avoids actual developers, projects and recognizable locations.

## Domain inventory and decision

The retired domain appeared as a website URL in canonical/deployment examples and
function defaults, as an email address in brand/email-function defaults, and as an
external configuration example in `.env.example`. It did not appear in historical
migrations. All application/public/documentation references now use the controlled
website `https://dlxproperties.com` and `hello@dlxproperties.com`. The
`check:domain` command fails if the retired website or email domain returns outside
immutable historical migrations.
