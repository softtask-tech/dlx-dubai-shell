/**
 * Schema.org JSON-LD builders.
 *
 * Search engines and AI answer engines read these to understand who DLX is and
 * what a page is about. Every builder returns a plain object; routes hand it to
 * `pageHead()`, which emits it as `application/ld+json`.
 *
 * Rule: schema describes content that is *visible on the page*. Never emit a
 * claim (a rating, a price, an availability) that a visitor cannot also read.
 */
import { SITE_URL, absoluteUrl, site } from "@/config/site";

type JsonLd = Record<string, unknown>;

/** Stable @id fragments so nodes can reference each other across the graph. */
export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
} as const;

const postalAddress: JsonLd = {
  "@type": "PostalAddress",
  streetAddress: site.address.street,
  addressLocality: site.address.locality,
  addressRegion: site.address.region,
  addressCountry: site.address.country,
};

/**
 * The brokerage itself, typed as both Organization and RealEstateAgent so
 * general and vertical-specific consumers both resolve it.
 */
export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": SCHEMA_IDS.organization,
    name: site.name,
    legalName: site.legalName,
    url: SITE_URL,
    description: site.description,
    slogan: site.tagline,
    logo: absoluteUrl("/favicon.png"),
    image: absoluteUrl("/og/home.png"),
    email: site.contact.email,
    telephone: site.contact.phoneE164,
    address: postalAddress,
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    areaServed: site.areasServed.map((name) => ({ "@type": "Place", name })),
    knowsLanguage: ["en", "ar"],
    sameAs: site.socials.map((s) => s.href),
    /* RERA Office Registration Number — the licence a Dubai brokerage trades under. */
    identifier: {
      "@type": "PropertyValue",
      name: "RERA ORN",
      value: site.reraOrn,
    },
  };
}

/** The site as a whole — ties every page back to one publisher. */
export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SCHEMA_IDS.website,
    url: SITE_URL,
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": SCHEMA_IDS.organization },
  };
}

export type BreadcrumbEntry = { name: string; path: string };

/** Breadcrumbs always start at Home, so callers pass only the trail beneath it. */
export function breadcrumbSchema(trail: readonly BreadcrumbEntry[]): JsonLd {
  const entries: BreadcrumbEntry[] = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

export type FaqEntry = { question: string; answer: string };

/**
 * FAQ schema. Only call this for questions that are also rendered on the page —
 * schema without visible content is the kind of trick Google penalises.
 */
export function faqSchema(entries: readonly FaqEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export type ArticleInput = {
  headline: string;
  description: string;
  path: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
};

/** Guides and market commentary. */
export function articleSchema(input: ArticleInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: absoluteUrl(input.image),
    inLanguage: site.language,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
    author: { "@type": "Organization", name: input.author ?? site.name },
    publisher: { "@id": SCHEMA_IDS.organization },
  };
}

export type ListingInput = {
  name: string;
  description: string;
  path: string;
  image: string;
  /** Community or district, e.g. "Palm Jumeirah". */
  area: string;
  bedrooms?: number;
  bathrooms?: number;
  /** Internal floor area in square feet. */
  floorAreaSqFt?: number;
  /** Omit entirely when a property is price-on-application. */
  price?: { amount: number; currency: string };
};

/**
 * A single property. Price is optional on purpose: off-market representation is
 * frequently price-on-application, and an invented figure is worse than none.
 */
export function listingSchema(input: ListingInput): JsonLd {
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    image: absoluteUrl(input.image),
    datePosted: new Date().toISOString().slice(0, 10),
    provider: { "@id": SCHEMA_IDS.organization },
    address: { ...postalAddress, addressLocality: input.area },
  };

  if (input.price) {
    schema["offers"] = {
      "@type": "Offer",
      price: input.price.amount,
      priceCurrency: input.price.currency,
      availability: "https://schema.org/InStock",
      seller: { "@id": SCHEMA_IDS.organization },
    };
  }

  const accommodation: JsonLd = { "@type": "Accommodation", name: input.name };
  if (input.bedrooms !== undefined) accommodation["numberOfBedrooms"] = input.bedrooms;
  if (input.bathrooms !== undefined) accommodation["numberOfBathroomsTotal"] = input.bathrooms;
  if (input.floorAreaSqFt !== undefined) {
    accommodation["floorSize"] = {
      "@type": "QuantitativeValue",
      value: input.floorAreaSqFt,
      unitCode: "FTK",
    };
  }
  schema["mainEntity"] = accommodation;

  return schema;
}

export type ReviewInput = {
  author: string;
  body: string;
  /** 1–5. */
  rating: number;
  datePublished: string;
};

/** Client testimonials. Only ever built from reviews we actually hold. */
export function reviewSchema(input: ReviewInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@id": SCHEMA_IDS.organization },
    author: { "@type": "Person", name: input.author },
    reviewBody: input.body,
    datePublished: input.datePublished,
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.rating,
      bestRating: 5,
      worstRating: 1,
    },
  };
}
