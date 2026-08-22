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
