export type CommercialProjectMedia = {
  /** Base path; responsive AVIF/WebP/JPEG variants are appended by the renderer. */
  src: string;
  alt: string;
  caption: string;
  illustrative: true;
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

export type CommercialProject = {
  isDemo: true;
  publicationStatus: "demo";
  slug: string;
  name: string;
  developerName: string;
  locationName: string;
  projectType: string;
  hero: CommercialProjectMedia;
  gallery: readonly CommercialProjectMedia[];
  startingPrice: null;
  propertyTypes: readonly string[];
  bedrooms: null;
  unitSizeRangeSqFt: null;
  handover: null;
  constructionStatus: "Concept preview";
  paymentPlan: readonly [];
  amenities: readonly string[];
  overview: readonly string[];
  floorPlans: readonly [];
  brochureUrl: null;
  investmentConsiderations: readonly string[];
  serviceChargeNote: null;
  officialDldRecord: null;
  relatedMarketEvidence: readonly [];
  similarProjectSlugs: readonly string[];
  availableUnits: readonly [];
  assignedConsultant: null;
  sourceLabel: "DLX concept fixture";
  updatedAt: "2026-09-05";
  advertisingCompliance: AdvertisingCompliance;
};

const previewCompliance: AdvertisingCompliance = {
  officeRegistrationNumber: null,
  responsibleBrokerBrn: null,
  advertisementPermitNumber: null,
  authorityIssuedQrAsset: null,
  permitValidTo: null,
  sourceUpdatedAt: null,
  validationStatus: "unavailable-preview",
};

const media = (src: string, alt: string, caption: string): CommercialProjectMedia => ({
  src,
  alt,
  caption,
  illustrative: true,
});

export const DEMO_OFF_PLAN_PROJECTS: readonly CommercialProject[] = [
  {
    isDemo: true,
    publicationStatus: "demo",
    slug: "harbour-canvas-residences",
    name: "Harbour Canvas Residences",
    developerName: "Canvas Harbour Developments (fictional)",
    locationName: "The Imagined Waterfront, Dubai concept",
    projectType: "Waterfront apartments",
    hero: media(
      "/photos/off-plan-harbour-canvas",
      "Illustrative concept of two pale-stone apartment buildings beside a calm fictional waterfront",
      "AI-generated architectural concept; not a real project or location.",
    ),
    gallery: [
      media(
        "/photos/off-plan-harbour-canvas-detail",
        "Illustrative close view of pale-stone waterfront balconies with planting and calm water",
        "AI-generated architectural detail; not a real project or location.",
      ),
    ],
    startingPrice: null,
    propertyTypes: ["Apartments"],
    bedrooms: null,
    unitSizeRangeSqFt: null,
    handover: null,
    constructionStatus: "Concept preview",
    paymentPlan: [],
    amenities: ["Illustrative waterfront promenade", "Illustrative shaded gardens"],
    overview: [
      "A visual prototype exploring how DLX could present a composed waterfront apartment release. The name, architecture, developer and setting are fictional.",
      "Commercial terms, specifications, availability and delivery information have intentionally not been invented.",
    ],
    floorPlans: [],
    brochureUrl: null,
    investmentConsiderations: [
      "Future real records should compare launch terms, supply, service costs, construction progress and verified market evidence.",
    ],
    serviceChargeNote: null,
    officialDldRecord: null,
    relatedMarketEvidence: [],
    similarProjectSlugs: ["meridian-gate"],
    availableUnits: [],
    assignedConsultant: null,
    sourceLabel: "DLX concept fixture",
    updatedAt: "2026-09-05",
    advertisingCompliance: previewCompliance,
  },
  {
    isDemo: true,
    publicationStatus: "demo",
    slug: "saffron-grove-villas",
    name: "Saffron Grove Villas",
    developerName: "Saffron Grove Communities (fictional)",
    locationName: "The Fictional Garden District, Dubai concept",
    projectType: "Family villas",
    hero: media(
      "/photos/off-plan-saffron-grove",
      "Illustrative concept of warm mineral villas arranged around a shaded fictional garden",
      "AI-generated architectural concept; not a real project or location.",
    ),
    gallery: [
      media(
        "/photos/off-plan-saffron-grove-detail",
        "Illustrative shaded courtyard path between warm mineral villas and native planting",
        "AI-generated architectural detail; not a real project or location.",
      ),
    ],
    startingPrice: null,
    propertyTypes: ["Villas"],
    bedrooms: null,
    unitSizeRangeSqFt: null,
    handover: null,
    constructionStatus: "Concept preview",
    paymentPlan: [],
    amenities: ["Illustrative shared green", "Illustrative shaded walking routes"],
    overview: [
      "A visual prototype for a quieter family-focused community story, using fictional architecture and a deliberately non-identifiable setting.",
      "No price, payment plan, unit specification, availability or handover claim is attached to this concept.",
    ],
    floorPlans: [],
    brochureUrl: null,
    investmentConsiderations: [
      "A future real project page should make plot, maintenance, phasing, nearby supply and verified transaction evidence easy to compare.",
    ],
    serviceChargeNote: null,
    officialDldRecord: null,
    relatedMarketEvidence: [],
    similarProjectSlugs: ["harbour-canvas-residences"],
    availableUnits: [],
    assignedConsultant: null,
    sourceLabel: "DLX concept fixture",
    updatedAt: "2026-09-05",
    advertisingCompliance: previewCompliance,
  },
  {
    isDemo: true,
    publicationStatus: "demo",
    slug: "meridian-gate",
    name: "Meridian Gate",
    developerName: "Meridian Urban Works (fictional)",
    locationName: "The Imagined Central Quarter, Dubai concept",
    projectType: "Urban apartments",
    hero: media(
      "/photos/off-plan-meridian-gate",
      "Illustrative concept of a precise pale-stone residential tower in a fictional urban district",
      "AI-generated architectural concept; not a real project or location.",
    ),
    gallery: [
      media(
        "/photos/off-plan-meridian-gate-detail",
        "Illustrative pedestrian view of a pale-stone tower lobby and landscaped terrace",
        "AI-generated architectural detail; not a real project or location.",
      ),
    ],
    startingPrice: null,
    propertyTypes: ["Apartments"],
    bedrooms: null,
    unitSizeRangeSqFt: null,
    handover: null,
    constructionStatus: "Concept preview",
    paymentPlan: [],
    amenities: ["Illustrative resident lounge", "Illustrative landscaped public realm"],
    overview: [
      "A fictional central-city tower used to prototype an evidence-led investment page without presenting an actual development or offer.",
      "Every commercial field remains unconfirmed until real, auditable inventory is supplied.",
    ],
    floorPlans: [],
    brochureUrl: null,
    investmentConsiderations: [
      "Future analysis should separate verified price evidence, holding costs, competing supply and delivery risk from marketing narrative.",
    ],
    serviceChargeNote: null,
    officialDldRecord: null,
    relatedMarketEvidence: [],
    similarProjectSlugs: ["harbour-canvas-residences"],
    availableUnits: [],
    assignedConsultant: null,
    sourceLabel: "DLX concept fixture",
    updatedAt: "2026-09-05",
    advertisingCompliance: previewCompliance,
  },
] as const;

export function getDemoOffPlanProject(slug: string): CommercialProject | null {
  return DEMO_OFF_PLAN_PROJECTS.find((project) => project.slug === slug) ?? null;
}
