/**
 * The two off-plan projects DLX is currently focused on.
 *
 * Every fact here is taken from the developer's own published brochure or
 * factbook. Where a brochure does not state a figure — price, payment plan,
 * handover — the field stays null and the page says so. Nothing is estimated,
 * inferred or filled in for the sake of a complete-looking page.
 */

export type CommercialProjectMedia = {
  /** Base path; responsive AVIF/WebP/JPEG variants are appended by the renderer. */
  src: string;
  alt: string;
  caption: string;
  /** True when the frame is an illustrative impression rather than developer CGI. */
  illustrative: boolean;
};

export type AdvertisingCompliance = {
  officeRegistrationNumber: string | null;
  responsibleBrokerBrn: string | null;
  advertisementPermitNumber: string | null;
  authorityIssuedQrAsset: string | null;
  permitValidTo: string | null;
  sourceUpdatedAt: string | null;
  validationStatus: "unavailable-preview" | "pending" | "passed" | "failed";
};

/** A headline figure quoted directly from the developer's material. */
export type ProjectFigure = {
  value: string;
  label: string;
  /** Plain-English line: what this actually means for a buyer. */
  meaning: string;
};

/** A named sub-collection within a masterplan. */
export type ProjectCollection = {
  name: string;
  homeType: string;
  bedrooms: string;
  description: string;
};

export type ProjectConnection = {
  place: string;
  distance: string;
};

export type CommercialProject = {
  publicationStatus: "focus";
  slug: string;
  name: string;
  developerName: string;
  locationName: string;
  projectType: string;
  /** One line a reader understands in two seconds. */
  headline: string;
  hero: CommercialProjectMedia;
  gallery: readonly CommercialProjectMedia[];
  /** Null until the developer's current price list is confirmed in writing. */
  startingPrice: number | null;
  priceNote: string;
  propertyTypes: readonly string[];
  bedrooms: string | null;
  unitSizeRangeSqFt: string | null;
  handover: string | null;
  constructionStatus: string;
  figures: readonly ProjectFigure[];
  collections: readonly ProjectCollection[];
  connectivity: readonly ProjectConnection[];
  paymentPlan: readonly { stage: string; share: string }[];
  paymentPlanNote: string;
  amenities: readonly string[];
  overview: readonly string[];
  floorPlans: readonly { label: string; note: string }[];
  brochureUrl: string | null;
  investmentConsiderations: readonly string[];
  serviceChargeNote: string | null;
  officialDldRecord: string | null;
  similarProjectSlugs: readonly string[];
  assignedConsultant: string | null;
  sourceLabel: string;
  updatedAt: string;
  advertisingCompliance: AdvertisingCompliance;
};

const pendingCompliance: AdvertisingCompliance = {
  officeRegistrationNumber: null,
  responsibleBrokerBrn: null,
  advertisementPermitNumber: null,
  authorityIssuedQrAsset: null,
  permitValidTo: null,
  sourceUpdatedAt: null,
  validationStatus: "pending",
};

const media = (src: string, alt: string, caption: string): CommercialProjectMedia => ({
  src,
  alt,
  caption,
  illustrative: false,
});

export const OFF_PLAN_PROJECTS: readonly CommercialProject[] = [
  {
    publicationStatus: "focus",
    slug: "azizi-florence",
    name: "Azizi Florence",
    developerName: "Azizi Developments",
    locationName: "Sheikh Mohammed Bin Zayed Road (E311), Sharjah",
    projectType: "Masterplanned community · apartments, townhouses and villas",
    headline:
      "Sharjah's largest masterplanned community: 30 million sq ft, a 1.7 million sq ft central park, and homes from apartments to six-bedroom villas.",
    hero: media(
      "/photos/off-plan-azizi-florence",
      "Aerial render of the Azizi Florence masterplan, its clusters set around a central green spine",
      "Developer render. Source: Azizi Developments — Azizi Florence brochure.",
    ),
    gallery: [
      media(
        "/photos/off-plan-azizi-florence-park",
        "Render of a landscaped park within Azizi Florence, with shaded walkways and seating",
        "Developer render of the community parkland. Source: Azizi Developments.",
      ),
      media(
        "/photos/off-plan-azizi-florence-villa",
        "Render of a three-storey standalone villa at Azizi Florence seen from the street",
        "Developer render of a standalone villa. Source: Azizi Developments.",
      ),
    ],

    startingPrice: null,
    priceNote:
      "The current release price list is issued by the developer and changes between releases. We send you the live list rather than publish a number that may already be out of date.",
    propertyTypes: ["Apartments", "Townhouses", "Standalone villas"],
    bedrooms: "Apartments, townhouses, and 4, 5 and 6-bedroom villas",
    unitSizeRangeSqFt: null,
    handover: null,
    constructionStatus: "Off-plan · phased delivery across six clusters",
    figures: [
      {
        value: "30M sq ft",
        label: "Masterplan",
        meaning: "A whole district rather than a single tower, so the surroundings are planned too.",
      },
      {
        value: "10,000+",
        label: "Homes across the community",
        meaning:
          "Over 7,200 villas and townhouses and more than 3,000 apartments, delivered in phases.",
      },
      {
        value: "1.7M sq ft",
        label: "Signature central park",
        meaning: "Azizi Bardini Park binds all six clusters, with 25% of the plan left as green open space.",
      },
      {
        value: "108",
        label: "Amenities",
        meaning:
          "Including a 700,000 sq ft residents' mall, two Jumaa mosques and a clubhouse in every cluster.",
      },
    ],
    collections: [
      {
        name: "Apartments",
        homeType: "Apartments",
        bedrooms: "Layouts confirmed per release",
        description:
          "More than 3,000 apartments distributed across the six clusters, each cluster served by its own clubhouse and park.",
      },
      {
        name: "Townhouses",
        homeType: "Townhouses",
        bedrooms: "Layouts confirmed per release",
        description:
          "Part of the 7,200+ villa and townhouse count, set along tree-lined boulevards inside the clusters.",
      },
      {
        name: "Standalone villas",
        homeType: "Three-storey villas",
        bedrooms: "4, 5 and 6 bedrooms",
        description:
          "Double-height living spaces, courtyards, master suites, dual rooftop terraces and a private elevator.",
      },
    ],
    connectivity: [
      { place: "Mohammed Bin Zayed Road (E311)", distance: "Direct access" },
      { place: "Sharjah city centre", distance: "See developer location map" },
    ],
    paymentPlan: [],
    paymentPlanNote:
      "Payment terms are set per release and per home type. We will send you the current schedule in writing before you commit to anything.",
    amenities: [
      "1.7 million sq ft Azizi Bardini Park",
      "700,000 sq ft residents' community mall",
      "600,000 sq ft retail space",
      "Clubhouse and park in each of the six clusters",
      "Two Jumaa mosques, plus a mosque within each cluster",
      "Cinema, gym, pool, sauna, steam and massage rooms",
      "Supermarket, food court and medical clinic",
      "Adventure zone, game room and escape room",
      "160,000+ trees and plants",
      "Restaurants, outdoor cafés and family gathering areas",
    ],
    overview: [
      "Azizi Florence runs along Sheikh Mohammed Bin Zayed Road (E311) and is the largest lifestyle community in the Emirate of Sharjah. It is a masterplan rather than a single building: 30 million sq ft, six residential clusters, a planned resident population of around 49,000.",
      "The six clusters split into two design languages. Lucardo, Bellarno and Soffiano are contemporary; Versilia, Pienza and Siena draw on Mediterranean stone and shade. Each has its own clubhouse and parks and all connect through a central spine to Azizi Bardini Park.",
      "For a buyer, the practical point is scale and phasing. You are buying into a community that will be delivered over several years, so the cluster, the release and the delivery sequence matter as much as the floor plan.",
    ],
    floorPlans: [
      {
        label: "Standalone villas, 4 / 5 / 6 bedrooms",
        note: "Type drawings are in the developer brochure; we send them on request.",
      },
      {
        label: "Apartments and townhouses",
        note: "Released per cluster. Ask us for the plans of the current release.",
      },
    ],
    brochureUrl: null,
    investmentConsiderations: [
      "This is a Sharjah masterplan, not Dubai. Ownership rules, service costs and rental demand differ from Dubai freehold, and it does not by itself qualify you for a Dubai property Golden Visa. Ask us to walk you through the difference before you decide.",
      "Delivery is phased across six clusters. Which cluster and which release you buy in decides when you get your keys and what the surroundings look like on the day you move in.",
      "Community-scale amenities — a private mall, parks, clubhouses — are funded through service charges over the life of the community. Ask for the projected charge before comparing yields with a smaller scheme.",
    ],
    serviceChargeNote:
      "Not published by the developer at this stage. We will request the projected figure in writing for you.",
    officialDldRecord: null,
    similarProjectSlugs: ["sobha-city-abu-dhabi"],
    assignedConsultant: null,
    sourceLabel: "Azizi Developments — Azizi Florence brochure",
    updatedAt: "2026-09-06",
    advertisingCompliance: pendingCompliance,
  },
  {
    publicationStatus: "focus",
    slug: "sobha-city-abu-dhabi",
    name: "Sobha City, Abu Dhabi",
    developerName: "Sobha Realty",
    locationName: "Abu Dhabi",
    projectType: "Masterplanned community · villas and residences",
    headline:
      "Sobha Realty's first masterplanned community in Abu Dhabi: around 60% open and green space, a 2 km waterfront promenade and three home collections.",
    hero: media(
      "/photos/off-plan-sobha-city",
      "Illustrative impression of a low-rise waterfront community with canals, promenades and dense tree planting",
      "Illustrative impression prepared by DLX. Refer to the developer's brochure for official renders.",
    ),
    gallery: [
      media(
        "/photos/off-plan-sobha-city-waterfront",
        "Illustrative impression of a shaded waterfront promenade beside calm water",
        "Illustrative impression of the promenade. Not an official developer render.",
      ),
      media(
        "/photos/off-plan-sobha-city-villa",
        "Illustrative impression of a contemporary garden villa with deep terraces and mature planting",
        "Illustrative impression of a garden villa. Not an official developer render.",
      ),
    ],
    startingPrice: null,
    priceNote:
      "Pricing is released by Sobha Realty per collection and per release. We send you the live list rather than publish a figure that may already be superseded.",
    propertyTypes: ["Estate villas", "Garden villas", "Apartments"],
    bedrooms: "3 to 6 bedrooms across the villa collections",
    unitSizeRangeSqFt: null,
    handover: null,
    constructionStatus: "Off-plan · phased delivery",
    figures: [
      {
        value: "~60%",
        label: "Open and green space",
        meaning: "Most of the masterplan is landscape rather than building footprint.",
      },
      {
        value: "50,000+",
        label: "Trees",
        meaning: "Planting is treated as infrastructure, which is what keeps the streets shaded.",
      },
      {
        value: "2 km",
        label: "Waterfront promenade",
        meaning: "A continuous shoreline walk, plus canals running through the community.",
      },
      {
        value: "~20 km",
        label: "Wellness loop",
        meaning:
          "A jogging and cycling network through the community, alongside a par-3 executive golf course.",
      },
    ],
    collections: [
      {
        name: "The Orchard",
        homeType: "Estate villas",
        bedrooms: "4, 5 and 6 bedrooms",
        description:
          "A collection of private estate villas set within the green corridors of the masterplan.",
      },
      {
        name: "The Terraces",
        homeType: "Garden villas",
        bedrooms: "3 and 4 bedrooms, each with majlis",
        description:
          "Garden villas designed around outdoor living, with a majlis in every layout.",
      },
      {
        name: "River Cove Residences",
        homeType: "Apartments",
        bedrooms: "Layouts confirmed per release",
        description: "An urban address within the community, closer to the water and the promenade.",
      },
    ],
    connectivity: [
      { place: "Zayed International Airport", distance: "14 min (14 km)" },
      { place: "Yas Mall", distance: "13 min (11 km)" },
      { place: "Ferrari World", distance: "15 min (13 km)" },
      { place: "Etihad Arena", distance: "15 min (14 km)" },
      { place: "SeaWorld Abu Dhabi", distance: "16 min (12 km)" },
      { place: "Louvre Abu Dhabi", distance: "25 min (35 km)" },
    ],
    paymentPlan: [],
    paymentPlanNote:
      "Payment terms are set per collection and per release. We will send you the current schedule in writing before you commit to anything.",
    amenities: [
      "2 km waterfront promenade and canals",
      "Par-3 executive golf course",
      "~20 km jogging and forest cycling loop",
      "Open-air gym, multi-sport courts and indoor games zone",
      "Climbing and adventure park",
      "Mosque, amphitheatre and multi-purpose lawns",
      "Pavilion, social decks and sculptural gardens",
      "Tai-chi and wellness lawns",
      "Children's play areas, forest trails and family parks",
      "Retail, courtyards and shaded walkways throughout",
    ],
    overview: [
      "Sobha City is Sobha Realty's first masterplanned community in Abu Dhabi, conceived at city scale. The plan is structured by water and landscape: canals, green corridors and a 2 km waterfront promenade, with roughly 60% of the site kept as open and green space.",
      "Homes come in three collections. The Orchard is estate villas of 4, 5 and 6 bedrooms; The Terraces is 3 and 4-bedroom garden villas, each with a majlis; River Cove Residences is the apartment address closer to the water.",
      "Sobha builds with a backward-integrated model — it controls design and construction in-house — which is the reason its delivery record is usually the first thing buyers ask about. It is a fair question to put to us, with evidence, before you commit.",
    ],
    floorPlans: [
      {
        label: "The Orchard — estate villas, 4 / 5 / 6 bedrooms",
        note: "Type drawings are in the developer brochure; we send them on request.",
      },
      {
        label: "The Terraces — garden villas, 3 / 4 bedrooms + majlis",
        note: "Type drawings are in the developer brochure; we send them on request.",
      },
      {
        label: "River Cove Residences — apartments",
        note: "Released per phase. Ask us for the plans of the current release.",
      },
    ],
    brochureUrl: null,
    investmentConsiderations: [
      "This is Abu Dhabi, not Dubai. Investment zones, transfer costs and rental demand behave differently, and our Dubai Land Department market data does not cover it — so treat any Dubai comparison as indicative only.",
      "A first community in a new emirate for the developer means the delivery sequence and the surrounding infrastructure timetable matter. Ask which phase you are buying into.",
      "Amenity density on this scale — golf, promenade, wellness loop — is carried by service charges. Ask for the projected figure before you compare returns with a smaller scheme.",
    ],
    serviceChargeNote:
      "Not published by the developer at this stage. We will request the projected figure in writing for you.",
    officialDldRecord: null,
    similarProjectSlugs: ["azizi-florence"],
    assignedConsultant: null,
    sourceLabel: "Sobha Realty — Sobha City master brochure and collection brochures",
    updatedAt: "2026-09-06",
    advertisingCompliance: pendingCompliance,
  },
];

export function getOffPlanProject(slug: string): CommercialProject | undefined {
  return OFF_PLAN_PROJECTS.find((project) => project.slug === slug);
}
