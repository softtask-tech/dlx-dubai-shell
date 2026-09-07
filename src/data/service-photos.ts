import type { PhotoSlug } from "@/lib/photos";

/**
 * A photograph per practice, and the grouping the services index reads by.
 *
 * The photographs live here rather than beside either page because both the
 * homepage and the services index set the same five practices, and a second
 * copy of the mapping is a second copy that drifts. Each practice gets its own
 * frame: two pages showing the same picture for two different services is the
 * fastest way to make a catalogue look padded.
 */
export const SERVICE_PHOTOS: Record<string, PhotoSlug> = {
  buy: "interchange-overhead-blue-hour",
  sell: "tower-facade-raking-light",
  rent: "downtown-interchange-day",
  "investment-advisory": "marble-brass-detail",
  "property-management": "terrace-edge-haze",
  "landlord-leasing": "harbour-golden-hour",
  "golden-visa": "burj-khalifa-dusk-silhouette",
  relocation: "villa-courtyard-morning",
  "business-setup": "dubai-marina-from-water",
};

/**
 * The nine, in three groups of three.
 *
 * Nine identical rows is a list, and a list makes the reader do the sorting.
 * These are really three different relationships with a firm: moving a
 * property, holding one, and arriving in the country. Someone who has just
 * accepted a job in Dubai and someone with a portfolio to restructure are not
 * scanning the same three items, and the grouping puts each of them in front
 * of their own set immediately.
 */
export type ServiceGroup = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  slugs: readonly string[];
};

export const SERVICE_GROUPS: readonly ServiceGroup[] = [
  {
    id: "transact",
    eyebrow: "Transacting",
    title: "Moving a property, in either direction.",
    lead: "Representation on your side of the table, whether you are the one buying, the one selling, or the one who has to live there afterwards.",
    slugs: ["buy", "sell", "rent"],
  },
  {
    id: "hold",
    eyebrow: "Holding",
    title: "What happens after the keys change hands.",
    lead: "Most of the money in Dubai property is made or lost in the years after the purchase, in the service charge, the tenant and the timing of the exit.",
    slugs: ["investment-advisory", "property-management", "landlord-leasing"],
  },
  {
    id: "arrive",
    eyebrow: "Arriving",
    title: "The parts that are not about property at all.",
    lead: "A residence route, a household to move, and sometimes a company to register. We handle the property side properly and say plainly where a licensed adviser has to take over.",
    slugs: ["golden-visa", "relocation", "business-setup"],
  },
];
