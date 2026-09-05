/**
 * Campaign landing pages.
 *
 * A landing page is not a smaller version of a site page. It exists to keep one
 * promise (the one the ad made) and to do exactly one thing about it. Every
 * link out is a way to lose someone who arrived ready to act, so these carry no
 * navigation, no related content and no second call to action.
 *
 * MESSAGE MATCH IS THE WHOLE JOB. Someone who clicked "Golden Visa property
 * from AED 2M" and lands on "Welcome to DLX Properties" bounces, and the click
 * is already paid for. The headline here restates the ad, in the ad's words.
 *
 * NOT IN THE NAV, NOT IN THE INDEX. They duplicate the site's own content by
 * design, they are written for one audience arriving from one ad, and a search
 * engine finding them instead of the real page is a worse result for everybody.
 * `noIndex` on every one, and none of them registered in `SITE_PAGES`.
 */
import type { LeadIntent } from "./types";

export type LandingProof = { figure: string; label: string };

export type LandingPage = {
  slug: string;
  /** Which campaign this is built for, for the record and the reporting. */
  audience: string;
  /** The `<h1>`. Restates the ad's promise, in the ad's words. */
  headline: string;
  /** One sentence under it. */
  standfirst: string;
  title: string;
  description: string;
  /** The single thing this page asks for. */
  offer: string;
  ctaLabel: string;
  /** Three numbers or facts that make the offer credible. */
  proof: LandingProof[];
  /** What they get, plainly. Four at most. This is not a features list. */
  bullets: string[];
  /** Objections the ad's audience actually has, answered without hedging. */
  faqs: Array<{ question: string; answer: string }>;
  formTitle: string;
  formDescription: string;
  intent: LeadIntent;
  /** Where the deeper reading lives, for the few who want it before acting. */
  readMore?: { label: string; to: string };
};

export const LANDING_PAGES: readonly LandingPage[] = [
  {
    slug: "off-plan-payment-plans",
    audience: "Investors searching off-plan payment plans",
    headline: "Off-plan in Dubai, with the payment plan read properly",
    standfirst:
      "A plan is a schedule, not a discount. We lay out what falls due and when, before you commit to it.",
    title: "Dubai off-plan payment plans, explained",
    description:
      "See what an off-plan payment plan actually costs you and when, instalment by instalment, with the handover figure that decides affordability. A DLX consultant walks it through.",
    offer: "A written breakdown of any plan you are considering",
    ctaLabel: "Get the breakdown",
    proof: [
      { figure: "4%", label: "DLD transfer fee, fixed, and in every figure we quote" },
      { figure: "0", label: "Developer commissions that change what we recommend" },
      { figure: "DLD", label: "Official processes and dated source evidence" },
    ],
    bullets: [
      "Every instalment dated, with the handover payment shown separately.",
      "What happens to the schedule if construction slips.",
      "Whether anything remains payable after you have the keys.",
      "The total cost of entry, including the fees the brochure leaves out.",
    ],
    faqs: [
      {
        question: "Is a longer payment plan better?",
        answer:
          "Not by itself. A long post-handover plan suits a buyer with steady income who intends to hold, and works against someone who planned to exit at handover. The right plan is the one that matches how you intend to own the property, not the one with the smallest first cheque.",
      },
      {
        question: "Do you charge for this?",
        answer:
          "No. We are paid by the seller or developer on a completed transaction. Reading a payment plan with you costs you nothing and carries no obligation.",
      },
      {
        question: "Can you do this for a project you do not represent?",
        answer:
          "Yes, and we will tell you plainly if we think the plan is worse than the alternatives, including when the alternative is not buying.",
      },
    ],
    formTitle: "Send us the plan",
    formDescription:
      "Tell us the project, or just the split you have been quoted, and a consultant will come back with it laid out.",
    intent: "invest",
    readMore: { label: "Off-plan versus ready, in full", to: "/guides/off-plan-vs-ready" },
  },
  {
    slug: "dubai-marina-apartments",
    audience: "Buyers searching a specific community",
    headline: "Buying in Dubai Marina, on recorded evidence",
    standfirst:
      "What has actually transacted, what it yields, and whether the asking price makes sense.",
    title: "Dubai Marina apartments: the numbers first",
    description:
      "Recorded transaction prices, rental yields and year-on-year movement for Dubai Marina, with a consultant who will tell you when an asking price does not stand up.",
    offer: "The community's recorded figures, and a view on the price you are looking at",
    ctaLabel: "See the numbers",
    proof: [
      { figure: "DLD", label: "Every figure computed from Land Department records" },
      { figure: "Monthly", label: "Recomputed as new registrations publish" },
      { figure: "Gross", label: "Yields stated before costs, always said, never buried" },
    ],
    bullets: [
      "Median price per square foot, and how it has moved over twelve months.",
      "What the building's service charge actually is, before you offer.",
      "Comparable registrations, so an asking price can be argued with.",
      "An honest answer on whether this is the right community for what you want.",
    ],
    faqs: [
      {
        question: "Where do the figures come from?",
        answer:
          "Dubai Land Department open data, cleaned into our own database and recomputed as new registrations publish. Every page states when it was last updated, and says so plainly where a figure is illustrative rather than recorded.",
      },
      {
        question: "Will you tell me not to buy?",
        answer:
          "When the numbers say so, yes. We would rather lose a transaction than place someone in a building we would not buy in ourselves.",
      },
      {
        question: "Do you only show your own listings?",
        answer:
          "No. If the right property is on someone else's book we will say so and represent you on it.",
      },
    ],
    formTitle: "Ask about the Marina",
    formDescription:
      "Tell us what you are considering: a specific tower, a budget, or just a question. A consultant will reply with the figures.",
    intent: "buy",
    readMore: { label: "Every community, in numbers", to: "/areas" },
  },
  {
    slug: "sell-your-dubai-property",
    audience: "Owners searching valuations and selling",
    headline: "What your Dubai property is actually worth",
    standfirst:
      "A valuation from recorded transactions in your building, not an optimistic number to win your instruction.",
    title: "Sell your Dubai property: an honest valuation",
    description:
      "A valuation built from Dubai Land Department registrations in your own building, with the fees, the timeline and the realistic price a buyer will pay.",
    offer: "A written valuation with the comparable registrations behind it",
    ctaLabel: "Value my property",
    proof: [
      { figure: "2%", label: "Agency commission, stated, and negotiable" },
      { figure: "Comparables", label: "Every valuation shows the registrations it rests on" },
      { figure: "No lock-in", label: "We earn the instruction on the work, not the contract" },
    ],
    bullets: [
      "The registered prices in your building, not the asking prices in the portals.",
      "What it will cost you to sell, itemised.",
      "How long comparable properties took to transact.",
      "The price we would actually list at, and why.",
    ],
    faqs: [
      {
        question: "Will you inflate the valuation to win the instruction?",
        answer:
          "No, and we will show you the registrations ours rests on so you can check. An inflated valuation wins an instruction and then costs the seller three months and a price reduction.",
      },
      {
        question: "What does selling cost?",
        answer:
          "Agency commission is conventionally two per cent and negotiable, plus the transfer and trustee charges. Our buying-costs schedule states every figure with its source and the date it was verified.",
      },
      {
        question: "Do I have to sign anything to get a valuation?",
        answer: "No. The valuation is yours whether you instruct us or not.",
      },
    ],
    formTitle: "Request the valuation",
    formDescription:
      "Tell us the building and the unit type. A consultant will come back with the figure and the evidence.",
    intent: "sell",
    readMore: { label: "What buying and selling costs", to: "/guides/buying-costs-and-fees" },
  },
  {
    slug: "golden-visa-property",
    audience: "Buyers searching Golden Visa property investment",
    headline: "Property, and the Golden Visa question answered properly",
    standfirst:
      "We will not tell you that you qualify. We will make sure the property and the paperwork are in the state an application expects.",
    title: "Dubai Golden Visa property, done properly",
    description:
      "How the Golden Visa property routes work, what a purchase needs to look like, and an introduction to a licensed adviser who confirms your position in writing before you buy.",
    offer: "An introduction to a licensed adviser, and a property that fits the route",
    ctaLabel: "Speak to a consultant",
    proof: [
      { figure: "Licensed", label: "Advisers who confirm eligibility in writing" },
      { figure: "Above, not at", label: "We look for properties comfortably over a threshold" },
      { figure: "In writing", label: "Nothing about your visa position stated verbally" },
    ],
    bullets: [
      "Properties that sit comfortably above a threshold rather than on it.",
      "Title and paperwork in the state an application expects, from the start.",
      "An introduction to advisers who process applications properly.",
      "A purchase structured with the residency objective on the table, not discovered late.",
    ],
    faqs: [
      {
        question: "Can you tell me if I qualify?",
        answer:
          "No, and anyone who does on a first call is guessing. Criteria are set by the UAE authorities and change, and an application turns on your circumstances as well as the property. We introduce you to licensed advisers who confirm it in writing.",
      },
      {
        question: "Does a mortgaged property count?",
        answer:
          "Conditions attach to mortgaged and off-plan property, and they are exactly the sort of thing to have confirmed before you commit rather than after. That confirmation comes from an adviser, not from us.",
      },
      {
        question: "Can I sponsor my family?",
        answer:
          "The property routes generally allow a holder to sponsor a spouse and children. The specifics (ages, dependency, documentation) are set by the authority, and should be established before you buy on the strength of them.",
      },
    ],
    formTitle: "Start the conversation",
    formDescription:
      "Tell us what you are considering and who would be coming with you. A consultant will come back the same day.",
    intent: "relocate",
    readMore: { label: "The Golden Visa guide", to: "/guides/golden-visa-guide" },
  },
];

export function landingPageBySlug(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
