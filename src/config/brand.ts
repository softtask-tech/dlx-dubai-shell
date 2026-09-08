/**
 * Brand facts, the things that are true about the company regardless of where
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
  domain: "dlxproperties.com",
  tagline: "Dubai property, decided on evidence.",
  /* Reaches Abu Dhabi and Sharjah because two live mandates are there, so the
   * projects surface in UAE-wide search. The on-page voice stays Dubai-first:
   * this is the description a crawler reads, not a repositioning. */
  description:
    "A Dubai brokerage pairing official Dubai Land Department records with hands-on advice on off-plan launches, prime residential acquisitions and long-term portfolio strategy, across Dubai, Abu Dhabi and Sharjah.",
  /** Internal corporate compliance fact. Render only in an applicable compliance block. */
  reraOrn: "40905",
  /** DED trade licence number. Compliance blocks only. */
  tradeLicence: "1307563",
  locale: "en_AE",
  language: "en",
  foundingLocation: "Dubai, United Arab Emirates",
  address: {
    street: "S210, Property Investment Office 4 S1, Dubai Investment Park First",
    locality: "Dubai",
    region: "Dubai",
    country: "AE",
    countryName: "United Arab Emirates",
  },
  /** Dubai Investment Park First, used for LocalBusiness geo coordinates. */
  geo: { latitude: 24.9857, longitude: 55.1713 },
  /** Office hours, in schema.org openingHours order. */
  openingHours: [
    { days: "Mon-Thu, Sat", hours: "9:00 to 17:00" },
    { days: "Friday", hours: "14:00 to 20:00" },
    { days: "Sunday", hours: "Closed" },
  ],
  contact: {
    email: "info@dlxproperties.com",
    phone: "+971 54 599 6911",
    /** E.164 form for `tel:` links and schema. */
    phoneE164: "+971545996911",
    /** Digits only, for wa.me links. */
    whatsapp: "971545996911",
  },

  /*
   * The real accounts.
   *
   * All three of the previous entries were wrong: the Instagram handle was
   * missing its trailing underscore, the LinkedIn slug was not the company's,
   * and a YouTube channel was listed that does not appear anywhere in what the
   * firm actually runs. These feed `sameAs` in the organisation schema, so a
   * wrong one tells Google that an account we do not control is us.
   *
   * The Instagram link is stored without the `?stkn=` share token it was
   * copied with. That token identifies the share, not the profile, and it does
   * not belong in a permanent link or in structured data.
   */
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/dlxproperties_" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/dlx-properties-llc/" },
    { label: "Facebook", href: "https://www.facebook.com/share/1CSVr3Rttf/" },
  ],

  /*
   * Where the firm is listed, and what each listing verifies.
   *
   * Separate from `socials` because these do a different job. A social account
   * is a channel; a portal profile is a third party stating that this
   * brokerage is registered with them, and in two cases awarding a badge
   * against its own criteria.
   *
   * `badge` is only ever set where the portal actually shows one, and every
   * entry carries the profile URL, because this site's rule for trust marks is
   * that a reader can go and check it. A badge we render without a link is a
   * graphic; a badge with the profile behind it is evidence.
   */
  portals: [
    {
      label: "Bayut",
      href: "https://www.bayut.com/companies/d-l-x-properties-104096/",
      badge: "SuperAgent",
      note: "Bayut's own performance badge, awarded on response time and listing quality.",
    },
    {
      label: "Property Finder",
      href: "https://www.propertyfinder.ae/en/broker/d-l-x-properties-8615",
      badge: "TruBroker",
      note: "Property Finder's verification, awarded on listing accuracy and client ratings.",
    },
    {
      label: "Dubizzle",
      href: "https://uae.dubizzle.com/property-agencies/d-l-x-properties-9019/",
      badge: null,
      note: "Our registered agency profile on the UAE's largest classifieds platform.",
    },
  ],
  /** Areas the brokerage actively represents, used for schema `areaServed`. */
  areasServed: [
    "Downtown Dubai",
    "Dubai Marina",
    "Palm Jumeirah",
    "Business Bay",
    "Emirates Hills",
    "Dubai Hills Estate",
  ],
} as const;
