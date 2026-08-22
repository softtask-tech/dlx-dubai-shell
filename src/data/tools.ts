/**
 * The calculator registry.
 *
 * One entry per tool, driving the hub, the routes, per-page SEO, the sitemap
 * and the advisor's knowledge index. Adding a calculator means adding an entry
 * and a component — everything else follows.
 */
import type { LeadIntent } from "./types";

export type ToolFaq = { question: string; answer: string };

export type Tool = {
  slug: string;
  /** Card and navigation label. */
  name: string;
  /** Page `<h1>`. */
  title: string;
  /** One editorial line — the standfirst and the OG card. */
  tagline: string;
  /** Meta description, plain language. */
  description: string;
  /** The question this tool answers, in the visitor's words. */
  question: string;
  /**
   * The plain-language answer to `question`, before any calculator is touched.
   *
   * The golden rule applied to a tool: a reader who wants the gist gets it in
   * one paragraph, and only then meets the inputs. It is also what an answer
   * engine quotes, which is why it is prose rather than a number.
   */
  answer: string;
  /** Grouping on the hub. */
  category: "Money" | "Residency" | "Comparison";
  /** Pre-selects the intent when this tool captures a lead. */
  intent: LeadIntent;
  /** True where the tool reads Dubai Land Department figures. */
  usesMarketData: boolean;
  /** True where legal, visa or tax content needs the verification note. */
  needsVerificationNote: boolean;
  faqs: ToolFaq[];
};

export const TOOLS: readonly Tool[] = [
  {
    slug: "golden-visa-eligibility",
    name: "Golden Visa checker",
    title: "Golden Visa eligibility checker",
    tagline: "Where a property purchase might place you.",
    description:
      "An indication of where a Dubai property purchase places you against the commonly cited Golden Visa property routes, including who you could sponsor. Not a determination.",
    question: "Would my purchase support a Golden Visa application?",
    answer:
      "It depends on the value of what you own and on criteria the UAE authorities set and revise, so no calculator can answer it — including this one. What this tool does is show where a purchase price sits relative to the property routes people commonly cite, and who a holder can generally sponsor, so you know which questions to put to a licensed immigration adviser before you structure a purchase around the answer.",
    category: "Residency",
    intent: "relocate",
    usesMarketData: false,
    needsVerificationNote: true,
    faqs: [
      {
        question: "Is this an eligibility decision?",
        answer:
          "No, and it cannot be. Criteria are set by the UAE authorities and change, and an application turns on your circumstances as well as the property. This shows where a purchase sits against commonly cited thresholds so you know what to ask. DLX does not process visa applications — we will introduce you to licensed advisers who do.",
      },
      {
        question: "Can I sponsor my family?",
        answer:
          "The property routes generally allow a holder to sponsor a spouse and children, and support staff in some cases. The specifics — ages, dependency, documentation — are set by the authority and are exactly the sort of thing to have confirmed in writing before you buy.",
      },
    ],
  },
  {
    slug: "rental-yield",
    name: "Yield calculator",
    title: "ROI and rental yield calculator",
    tagline: "What it actually returns, after the costs nobody quotes.",
    description:
      "Work out gross and net rental yield on a Dubai property, with service charges and voids taken off — the difference between the headline number and what reaches you.",
    question: "What will this property actually return?",
    answer:
      "Gross yield is the annual rent divided by the price; the number that matters is what is left after the service charge, the management fee and the weeks the property sits empty. That is usually one to two percentage points below the figure a listing quotes. This tool shows both, and lets you set every cost yourself rather than accepting an optimistic default.",
    category: "Money",
    intent: "invest",
    usesMarketData: true,
    needsVerificationNote: false,
    faqs: [
      {
        question: "Why is your net yield lower than the figure I was quoted?",
        answer:
          "Because most quoted yields are gross — rent divided by price, with nothing taken off. Service charges alone can take one to two percentage points off a Dubai yield, and that is before a void month or a repair. Net is the number you actually live on.",
      },
      {
        question: "What service charge should I use?",
        answer:
          "The real one for the building you are looking at. It varies from single digits per square foot to well over thirty, and it is the single biggest swing factor in the result. The Dubai Land Department publishes them per project, and we will get it for you if you ask.",
      },
    ],
  },
  {
    slug: "buying-costs",
    name: "Buying costs",
    title: "Dubai buying cost calculator",
    tagline: "The whole number, not the sticker price.",
    description:
      "Every cost on top of a Dubai purchase price — Dubai Land Department transfer fee, agency commission, trustee, developer NOC and title deed — totalled so there are no late surprises.",
    question: "What will this purchase cost me in total?",
    answer:
      "Budget for roughly six to seven per cent above the purchase price on a cash purchase of a ready property. The Dubai Land Department transfer fee is four per cent and fixed; agency commission is conventionally two per cent and negotiable; and the trustee office, developer No Objection Certificate and title deed charges are smaller fixed amounts. Every figure here comes from the dated fee schedule, and the ones that vary you can change.",
    category: "Money",
    intent: "buy",
    usesMarketData: false,
    needsVerificationNote: true,
    faqs: [
      {
        question: "What is the DLD fee?",
        answer:
          "The Dubai Land Department's 4% transfer fee for registering the property into your name. It is conventionally split between buyer and seller, but in practice the buyer usually pays it — assume you are unless your contract says otherwise.",
      },
      {
        question: "Are these figures fixed?",
        answer:
          "The DLD transfer fee is. Most of the rest are not: agency commission is negotiated, trustee fees are tiered by price, and developer NOC fees vary by developer. That is why every one of them is editable here — put your own figures in and the total follows.",
      },
    ],
  },
  {
    slug: "rent-vs-buy",
    name: "Rent vs buy",
    title: "Rent or buy in Dubai?",
    tagline: "How long before buying wins.",
    description:
      "Compare renting against buying the same Dubai property over time, including transaction costs and service charges, to find the point where buying comes out ahead.",
    question: "Should I rent or buy?",
    answer:
      "Buying wins once the years you stay outweigh the one-off cost of getting in and out — the transfer fee, the commission and the eventual exit. For most Dubai purchases that crossover sits a few years out, sooner where rent is high relative to price and later where it is not. Set your own rent, price and holding costs and the tool shows you the year the lines cross.",
    category: "Comparison",
    intent: "buy",
    usesMarketData: false,
    needsVerificationNote: false,
    faqs: [
      {
        question: "What makes buying win?",
        answer:
          "Time, mostly. Buying carries a large cost at the front — the transfer fee and commission are several per cent before you own anything — so a short stay almost always favours renting. The calculator finds the year those upfront costs are outweighed.",
      },
      {
        question: "Does this account for price growth?",
        answer:
          "Yes, as an assumption you set. It is an assumption, not a forecast — nobody knows what prices will do, and a calculator that pretends otherwise is selling something.",
      },
    ],
  },
  {
    slug: "yield-comparison",
    name: "Compare communities",
    title: "Compare Dubai communities",
    tagline: "Side by side, on recorded evidence.",
    description:
      "Compare Dubai communities on recorded price per square foot, gross rental yield, year-on-year movement and transaction volume, drawn from registered sales.",
    question: "Which community gives the better return?",
    answer:
      "The higher-yielding community is rarely the one with the higher prices. Yields tend to be strongest where entry prices are moderate and rents are firm, and weakest in the trophy communities, where buyers accept a lower return for the asset. This tool puts communities side by side on recorded transaction and rent evidence rather than on reputation.",
    category: "Comparison",
    intent: "invest",
    usesMarketData: true,
    needsVerificationNote: false,
    faqs: [
      {
        question: "Where do these numbers come from?",
        answer:
          "Recorded sales and registered tenancy contracts, cleaned into our own database. The source and the date sit beneath every figure, so you always know what you are reading.",
      },
    ],
  },
  {
    slug: "best-areas",
    name: "Best areas for…",
    title: "Best Dubai areas for what you want",
    tagline: "Ranked on evidence, not on who is advertising.",
    description:
      "Rank Dubai communities for yield, capital growth, family living or short-term rental potential, using recorded transaction data rather than sponsored placement.",
    question: "Where should I be looking?",
    answer:
      "There is no single best area — there is the best area for a budget, a return expectation and a way of living, and those three rarely point to the same place. Tell the tool which of them matters most and it ranks communities on recorded evidence. Nothing here is sponsored, and no developer pays to appear.",
    category: "Comparison",
    intent: "invest",
    usesMarketData: true,
    needsVerificationNote: false,
    faqs: [
      {
        question: "Is this ranking sponsored?",
        answer:
          "No. Nobody pays to appear here and the ordering is computed from recorded transactions. Where we hold too little data on a community to rank it honestly, we leave it out rather than pad the list.",
      },
    ],
  },
  {
    slug: "payment-plan",
    name: "Payment plan",
    title: "Off-plan payment plan explainer",
    tagline: "What you actually owe, and when.",
    description:
      "Turn an off-plan payment plan into a schedule of real dates and amounts, so you can see what falls due before handover and what waits until after.",
    question: "What do I pay, and when?",
    answer:
      "An off-plan payment plan is a schedule, not a discount. What matters is when each instalment falls due, whether it is triggered by a construction milestone or a calendar date, and how much lands at handover. This tool lays a plan out instalment by instalment so you can see the shape of it before you commit to it.",
    category: "Money",
    intent: "buy",
    usesMarketData: false,
    needsVerificationNote: false,
    faqs: [
      {
        question: "Why does the split matter?",
        answer:
          "Because a plan advertised as 60/40 can mean very different things. What matters is how much falls due before handover, when the instalments land, and whether the post-handover portion is interest-free. This lays them out as dates and amounts.",
      },
    ],
  },
  {
    slug: "currency-converter",
    name: "Currency converter",
    title: "Dubai property currency converter",
    tagline: "Dirhams, in your money.",
    description:
      "Convert Dubai property prices between dirhams and US dollars, euros, pounds, rupees and more, with the dirham's dollar peg always available.",
    question: "What is that in my currency?",
    answer:
      "The dirham is pegged to the US dollar, so a dollar buyer's price barely moves; everyone else is exposed to their own currency against the dollar. This converter shows a Dubai price in your money at the current rate, and tells you plainly when no live rate is available rather than converting at a guess.",
    category: "Money",
    intent: "advice",
    usesMarketData: false,
    needsVerificationNote: false,
    faqs: [
      {
        question: "Is the dirham stable against the dollar?",
        answer:
          "It is pegged. The UAE Central Bank has held the dirham at 3.6725 to the US dollar since 1997, so dollar buyers face no currency movement on a Dubai purchase. Other currencies move against the dollar as usual.",
      },
    ],
  },
];

export function toolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export const TOOL_CATEGORIES = ["Money", "Comparison", "Residency"] as const;

/**
 * The share card for a tool.
 *
 * Generated by `scripts/generate-og.mjs` from this same registry, so a card can
 * never describe a tool differently from its own meta tags. One definition,
 * used by the generator and by the route.
 */
export function toolOgPath(slug: string): string {
  return `/og/tools/${slug}.png`;
}
