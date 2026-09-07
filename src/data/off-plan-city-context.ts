/**
 * Where each mandate actually is, and what that changes.
 *
 * Kept out of `off-plan.ts` on purpose. That file is the factbook: every line
 * in it comes from the developer's own published brochure. This is DLX
 * writing, about the emirate rather than the project, and it belongs to the
 * project's own page rather than to the homepage, which stays Dubai-voiced.
 *
 * Two rules govern what may be said here.
 *
 * No invented specifics. Ownership structures, eligibility and transfer costs
 * are set by each emirate, they change, and they turn on the buyer's own
 * nationality and circumstances. CLAUDE.md forbids this site from stating them
 * and it does not: every entry says which authority decides, and routes the
 * answer to a consultant who will confirm it in writing.
 *
 * No borrowed figures. The Dubai Land Department data behind this site covers
 * Dubai. It does not cover Sharjah or Abu Dhabi, so no market figure is
 * published for either, and each entry says so rather than quietly implying
 * that the numbers elsewhere on the site apply.
 */
export type CityContext = {
  /** Section eyebrow, naming the emirate. */
  eyebrow: string;
  heading: string;
  paragraphs: readonly string[];
  /** The honest limit of what this site can tell them about this market. */
  dataNote: string;
};

export const CITY_CONTEXT: Record<string, CityContext> = {
  "azizi-florence": {
    eyebrow: "Sharjah, not Dubai",
    heading: "A commuter corridor, priced as one.",
    paragraphs: [
      "Sharjah is its own emirate. It borders Dubai, and the site sits on Sheikh Mohammed Bin Zayed Road, the corridor that carries the northern emirates into the city. That road is most of the investment case: a large share of demand here is people who work in Dubai and are priced out of living in it, so what this community is worth is tied to how long that journey takes and what the equivalent address in Dubai costs.",
      "It also means the rules are Sharjah's. What a buyer may own, and on what terms, is set by the Sharjah authorities rather than by the Dubai Land Department, and the structure available to you depends on your nationality. We will tell you exactly what you would hold, in writing, before you commit to anything. If a consultant cannot put it in writing, do not sign it.",
    ],
    dataNote:
      "The registered market data published on this site covers Dubai. It does not cover Sharjah, so we publish no price, yield or transaction figures for this community, and any comparison with a Dubai community should be treated as indicative only.",
  },
  "sobha-city-abu-dhabi": {
    eyebrow: "Abu Dhabi, not Dubai",
    heading: "A different emirate, a different rulebook.",
    paragraphs: [
      "Abu Dhabi is a separate market with its own regulator, its own designated investment zones, and its own transfer costs. Demand behaves differently from Dubai's: it is steadier, more owner-occupier, less driven by short-term investor flow, which tends to mean slower movement in both directions rather than the swings Dubai is known for.",
      "Eligibility and ownership structure are decided by the Abu Dhabi authorities, and they depend on who you are as much as on which home you choose. We will confirm what applies to you in writing before anything is signed. On the project itself, the question worth asking is delivery: Sobha builds in-house, and the record is checkable, so ask us to show it to you rather than take it as given.",
    ],
    dataNote:
      "The registered market data published on this site covers Dubai. It does not cover Abu Dhabi, so we publish no price, yield or transaction figures for this community, and any comparison with a Dubai community should be treated as indicative only.",
  },
};

export function cityContextFor(slug: string): CityContext | undefined {
  return CITY_CONTEXT[slug];
}
