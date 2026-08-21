/**
 * Brand facts — the things that are true about the company regardless of where
 * the site is deployed.
 *
 * Kept free of imports and `import.meta` so plain Node can load it: the OG card
 * generator (`scripts/generate-og.mjs`) reads the licence number and domain from
 * here rather than repeating them in a template. Deployment-specific values
 * (the canonical origin) live in `site.ts`.
 */

export const brand = {
  name: "DLX Properties",
  /** Short form used in the header monogram and social handles. */
  shortName: "DLX",
  legalName: "DLX Properties L.L.C.",
  /** Bare domain, shown on social cards and used as the default canonical origin. */
  domain: "dlxproperties.ae",
  tagline: "Dubai real estate, handled with intention.",
  description:
    "A private Dubai brokerage advising on prime residential acquisitions, off-market sales and long-term portfolio strategy.",
  /** RERA Office Registration Number — shown on every page in the footer. */
  reraOrn: "40905",
  locale: "en_AE",
  language: "en",
  foundingLocation: "Dubai, United Arab Emirates",
  address: {
    street: "Business Bay",
    locality: "Dubai",
    region: "Dubai",
    country: "AE",
    countryName: "United Arab Emirates",
  },
  /** Business Bay, Dubai — used for LocalBusiness geo coordinates. */
  geo: { latitude: 25.1857, longitude: 55.2766 },
  contact: {
    email: "hello@dlxproperties.ae",
    phone: "+971 (0) 000 0000",
    /** E.164 form for `tel:` links and schema. */
    phoneE164: "+9710000000",
  },
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/dlxproperties" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/dlxproperties" },
    { label: "YouTube", href: "https://www.youtube.com/@dlxproperties" },
  ],
  /** Areas the brokerage actively represents — used for schema `areaServed`. */
  areasServed: [
    "Downtown Dubai",
    "Dubai Marina",
    "Palm Jumeirah",
    "Business Bay",
    "Emirates Hills",
    "Dubai Hills Estate",
  ],
} as const;
