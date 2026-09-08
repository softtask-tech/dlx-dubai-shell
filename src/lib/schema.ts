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
import { DEFAULT_LOCALE, localePath, type LocaleCode } from "@/config/locales";
import { dictionaryFor } from "@/i18n";
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
    logo: absoluteUrl("/icon-512.png"),
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
  };
}

/** The site as a whole, ties every page back to one publisher. */
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

/**
 * Breadcrumbs always start at Home, so callers pass only the trail beneath it.
 *
 * On a translated page both the label and the URLs belong to that language: a
 * crumb reading "Home" above an Arabic page, pointing at the English homepage,
 * tells a search engine the two pages are one trail when they are two.
 */
export function breadcrumbSchema(
  trail: readonly BreadcrumbEntry[],
  locale: LocaleCode = DEFAULT_LOCALE,
): JsonLd {
  const entries: BreadcrumbEntry[] = [
    { name: dictionaryFor(locale).nav.home, path: localePath("/", locale) },
    ...trail.map((entry) => ({ name: entry.name, path: localePath(entry.path, locale) })),
  ];
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

export type PersonInput = {
  slug: string;
  name: string;
  jobTitle?: string | null;
  description?: string | null;
  image?: string | null;
  email?: string | null;
  telephone?: string | null;
  /** RERA Broker Registration Number, omitted when we do not hold one. */
  brn?: string | null;
  languages?: readonly string[];
  specialities?: readonly string[];
  sameAs?: readonly string[];
};

/**
 * A consultant, tied back to the brokerage.
 *
 * Only facts the profile page itself shows: no licence number is asserted for
 * someone whose BRN we do not hold, and no photograph is claimed before one
 * exists. `worksFor` points at the organisation node so an answer engine
 * resolves the person and the firm as one graph rather than two strangers.
 */
export function personSchema(input: PersonInput): JsonLd {
  const url = absoluteUrl(`/team/${input.slug}`);
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: input.name,
    url,
    worksFor: { "@id": SCHEMA_IDS.organization },
    /* The person is an agent of the brokerage, which is what a reader is
     * actually asking when they look one of them up. */
    memberOf: { "@id": SCHEMA_IDS.organization },
  };

  if (input.jobTitle) node["jobTitle"] = input.jobTitle;
  if (input.description) node["description"] = input.description;
  if (input.image) node["image"] = absoluteUrl(input.image);
  if (input.email) node["email"] = input.email;
  if (input.telephone) node["telephone"] = input.telephone;
  if (input.languages?.length) node["knowsLanguage"] = [...input.languages];
  if (input.specialities?.length) node["knowsAbout"] = [...input.specialities];
  if (input.sameAs?.length) node["sameAs"] = [...input.sameAs];
  if (input.brn) {
    node["identifier"] = {
      "@type": "PropertyValue",
      name: "RERA BRN",
      value: input.brn,
    };
    node["hasCredential"] = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "RERA Broker Registration Number",
      identifier: input.brn,
      recognizedBy: { "@type": "Organization", name: "Dubai Land Department" },
    };
  }

  return node;
}

/** The team page: an ordered list of the people it shows. */
export function teamListSchema(people: readonly { slug: string; name: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} consultants`,
    itemListElement: people.map((person, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/team/${person.slug}`),
      name: person.name,
    })),
  };
}

/**
 * A collection page, as the list it actually is.
 *
 * The index pages were emitting no structured data at all: a crawler reading
 * /services or /off-plan got a breadcrumb and nothing describing what the page
 * lists. An answer engine asked "what services does DLX offer" then has to
 * infer the answer from prose, when the page knows it exactly.
 *
 * Deliberately an ItemList of names and URLs rather than a set of full nodes
 * per entry. The detail page for each item already publishes its own richer
 * schema, and repeating a partial copy here would mean two descriptions of the
 * same thing that drift apart.
 */
export function itemListSchema(input: {
  name: string;
  items: readonly { name: string; path: string; description?: string }[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export type ProjectInput = {
  name: string;
  path: string;
  description: string;
  image: string;
  developerName: string;
  locationName: string;
  /** "Under construction", "Handover 2027": whatever the page states. */
  constructionStatus?: string | null;
  numberOfRooms?: string | null;
};

/**
 * An off-plan development.
 *
 * `ApartmentComplex` rather than a listing with an offer: we publish no price
 * and no availability for these projects, and an `Offer` node without a price
 * is exactly the empty claim the schema rules here forbid.
 */
export function projectSchema(input: ProjectInput): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    image: absoluteUrl(input.image),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.locationName,
      addressCountry: site.address.country,
    },
    brand: { "@type": "Organization", name: input.developerName },
    /* Who is marketing it, which is the fact we can stand behind. */
    provider: { "@id": SCHEMA_IDS.organization },
  };
  if (input.constructionStatus) node["additionalProperty"] = {
    "@type": "PropertyValue",
    name: "Construction status",
    value: input.constructionStatus,
  };
  if (input.numberOfRooms) node["numberOfRooms"] = input.numberOfRooms;
  return node;
}

export type FaqEntry = { question: string; answer: string };


/**
 * FAQ schema. Only call this for questions that are also rendered on the page,
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
  /** 1-5. */
  rating: number;
  datePublished: string;
};

/**
 * Client testimonials. Only ever built from reviews we actually hold.
 *
 * Callers must pass reviews that are also rendered on the page and that a
 * reader can verify at their source, `reviewSchemaFor` below enforces both by
 * taking the same rows the block renders. Emitting Review schema for in-house
 * copy is a fabricated record, and it is the specific abuse that gets a site's
 * rich results removed rather than merely ignored.
 */
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

/**
 * Review schema for a set of testimonials, or nothing.
 *
 * Takes the rows the page is rendering, so the schema and the visible content
 * cannot disagree. Rows with no rating are skipped: a Review node needs a
 * `reviewRating`, and inventing a five out of five for a quote that never
 * carried a score would be exactly the kind of claim this codebase does not
 * make.
 *
 * `aggregateRating` is deliberately never emitted. It would need every review
 * of the business, not the handful this page shows, and a star average
 * computed from a curated selection is a number that flatters itself.
 */
export function reviewSchemaFor(
  testimonials: ReadonlyArray<{
    author_name: string;
    quote: string;
    rating: number | null;
    source_url: string | null;
    published_at: string | null;
    created_at: string;
  }>,
): JsonLd[] {
  return testimonials
    .filter((entry) => typeof entry.rating === "number" && Boolean(entry.source_url))
    .map((entry) =>
      reviewSchema({
        author: entry.author_name,
        body: entry.quote,
        rating: entry.rating as number,
        datePublished: (entry.published_at ?? entry.created_at).slice(0, 10),
      }),
    );
}

export type DatasetInput = {
  name: string;
  description: string;
  path: string;
  /** True only when the figures really are Dubai Land Department records. */
  isOfficial: boolean;
  dateModified: string;
  /** ISO 8601 interval, e.g. "2025-08-01/2026-08-01". */
  temporalCoverage?: string;
  spatialCoverage?: string;
};

/**
 * Dataset schema for the market pages.
 *
 * This is what makes the figures citable by AI answer engines, which is the
 * point of publishing them: a question like "what does a square foot cost in
 * Dubai Marina" should be answerable from our data, with attribution.
 *
 * The attribution is conditional on provenance. When the rows are DLD records
 * the dataset credits the Dubai Land Department as source and DLX as the
 * publisher of the derived statistics, a real distinction, and one that keeps
 * us from implying an affiliation we do not have. When the rows are
 * illustrative the schema says so, so a model that ingests the page cannot
 * repeat a sample figure as an official one.
 */
export function datasetSchema(input: DatasetInput): JsonLd {
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: input.name,
    description: input.isOfficial
      ? input.description
      : `${input.description} These figures are illustrative sample data, not Dubai Land Department records.`,
    url: absoluteUrl(input.path),
    inLanguage: site.language,
    dateModified: input.dateModified,
    /* We publish the derived statistics; DLD publishes the underlying records. */
    creator: { "@id": SCHEMA_IDS.organization },
    publisher: { "@id": SCHEMA_IDS.organization },
    isAccessibleForFree: true,
  };

  if (input.temporalCoverage) schema["temporalCoverage"] = input.temporalCoverage;
  if (input.spatialCoverage) {
    schema["spatialCoverage"] = { "@type": "Place", name: input.spatialCoverage };
  }

  if (input.isOfficial) {
    schema["isBasedOn"] = {
      "@type": "Dataset",
      name: "Dubai Land Department open data",
      url: "https://www.dubaipulse.gov.ae/organisation/dld",
      creator: { "@type": "GovernmentOrganization", name: "Dubai Land Department" },
    };
    schema["license"] = "https://www.dubaipulse.gov.ae/terms";
  }

  return schema;
}
