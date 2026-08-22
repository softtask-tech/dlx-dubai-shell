/**
 * The service catalogue.
 *
 * Static rather than database-backed: these nine are the practice itself, they
 * change about once a year, and keeping them in code means each one is
 * type-checked, server-rendered and reviewable in a pull request.
 *
 * A note on the copy. CLAUDE.md forbids inventing legal, visa or tax specifics,
 * so every page describes *what DLX does* and routes the specifics to a
 * consultant. No thresholds, no eligibility rules, no tax claims — those are
 * for a licensed adviser to state, and for this copy to point at.
 */
import type { LeadIntent } from "./types";

export type ServiceFaq = { question: string; answer: string };

export type Service = {
  slug: string;
  /** Navigation and card label. */
  name: string;
  /** Page `<h1>`. */
  title: string;
  /** One editorial line — the OG card and the page standfirst. */
  tagline: string;
  /** Meta description, 150–160 characters of plain language. */
  description: string;
  /** Two or three paragraphs of body copy. */
  body: string[];
  /** What the client actually gets, as a numbered list. */
  deliverables: string[];
  /** Who this is for. */
  audience: string;
  /** Pre-selects the enquiry form's intent step. */
  intent: LeadIntent;
  /** Heading on this page's enquiry form. */
  formTitle: string;
  /** Questions a real client asks, answered honestly. */
  faqs: ServiceFaq[];
};

export const SERVICES: readonly Service[] = [
  {
    slug: "buy",
    name: "Buy",
    title: "Buying in Dubai",
    tagline: "Represented on your side of the table.",
    description:
      "Buyer representation across Dubai's prime districts — sourcing, viewings, due diligence and negotiation, with one consultant from first call to handover.",
    body: [
      "Most buyers in Dubai are shown whatever the agent happens to be listing. We work the other way round: we start from what you are trying to achieve, then go and find it — including properties that are not publicly advertised.",
      "You get one consultant throughout. They shortlist, arrange the viewings, check the building and the developer, sit on your side of the negotiation, and stay with the transaction through the Dubai Land Department process until the keys are yours.",
    ],
    deliverables: [
      "A shortlist built to your brief, including off-market options",
      "Viewings arranged around your schedule, in person or on video",
      "Building, developer and service-charge due diligence before you commit",
      "Negotiation handled by someone whose only client is you",
      "Transaction management through to DLD transfer and handover",
    ],
    audience:
      "First-time buyers into Dubai, families relocating, and owners adding to a portfolio.",
    intent: "buy",
    formTitle: "Tell us what you're looking for",
    faqs: [
      {
        question: "Can I buy in Dubai if I don't live there?",
        answer:
          "Yes — a large share of Dubai's buyers are non-residents, and we represent many of them remotely. Viewings, due diligence and negotiation can all be handled on your behalf. Where a step requires you in person or through a power of attorney, we tell you before you commit to anything.",
      },
      {
        question: "What does it cost to use a buyer's agent?",
        answer:
          "Our fee is agreed with you in writing before we start, so there are no surprises at the end. We will set it out plainly on our first call, along with the other transaction costs you should budget for.",
      },
      {
        question: "How long does a purchase take?",
        answer:
          "It depends on whether the property is ready or off-plan, and on whether you are buying in cash or with finance. We will give you a realistic timeline for your specific situation rather than a brochure number.",
      },
    ],
  },
  {
    slug: "sell",
    name: "Sell",
    title: "Selling a Dubai property",
    tagline: "A quiet, well-run sale.",
    description:
      "Discreet representation for sellers — pricing built on Dubai Land Department evidence, considered marketing, and a negotiation run properly.",
    body: [
      "A sale is won before it is listed. We price from what has actually transacted in your building and community — Dubai Land Department records, not the asking prices of the neighbours — and we tell you what we think it is worth even when that is not what you hoped to hear.",
      "From there it is presentation and discipline: photography that does the property justice, controlled exposure to the right buyers, and a negotiation where we hold the line on your behalf. Where discretion matters, a sale can be run entirely off-market.",
    ],
    deliverables: [
      "A valuation grounded in comparable DLD transactions",
      "Photography, floor plans and a proper listing presentation",
      "Controlled marketing, including a fully off-market route if you prefer",
      "Qualified buyers only — we screen before we bring anyone through your door",
      "Negotiation and transaction management through to transfer",
    ],
    audience: "Private owners, family offices and landlords exiting a position.",
    intent: "sell",
    formTitle: "Request a valuation",
    faqs: [
      {
        question: "What is my property actually worth?",
        answer:
          "We will tell you, based on what comparable homes in your building and community have actually sold for in Dubai Land Department records. That is a different number from what similar properties are being advertised at, and it is the one that matters.",
      },
      {
        question: "Can you sell it without advertising it publicly?",
        answer:
          "Yes. An off-market sale reaches a smaller, pre-qualified audience through our own network rather than a portal. It suits owners who want discretion, and it often suits the price too.",
      },
    ],
  },
  {
    slug: "rent",
    name: "Rent",
    title: "Renting in Dubai",
    tagline: "The right home, without the runaround.",
    description:
      "Tenant representation across Dubai — a shortlist that matches your brief, viewings that are worth your time, and a tenancy contract you understand before you sign.",
    body: [
      "Renting in Dubai can mean a week of viewings arranged by five different agents, half of which are not what was advertised. We do it once, properly: one brief, one shortlist, one person accountable for it.",
      "We handle the tenancy contract, the Ejari registration and the handover checks, and we explain what you are signing before you sign it — including what happens at renewal.",
    ],
    deliverables: [
      "A shortlist filtered to your budget, commute and family needs",
      "Viewings grouped into as few trips as possible",
      "Tenancy contract, Ejari registration and handover inspection",
      "A plain explanation of your obligations and your renewal position",
    ],
    audience:
      "Professionals arriving in Dubai, relocating families, and owners renting between homes.",
    intent: "rent",
    formTitle: "Tell us what you need",
    faqs: [
      {
        question: "How far in advance should I start looking?",
        answer:
          "Four to six weeks before you need to move is usually right. Earlier than that and the good stock will be gone by the time you arrive; later and you will be choosing under pressure.",
      },
      {
        question: "Do you charge tenants a fee?",
        answer:
          "We agree any fee with you in writing before we start work, and we will say plainly on the first call what it is. Nothing is deducted or added at the end that you have not already seen.",
      },
    ],
  },
  {
    slug: "property-management",
    name: "Property Management",
    title: "Property management",
    tagline: "Owned there, lived in here.",
    description:
      "Full management for Dubai owners who are not in Dubai — tenants, maintenance, inspections, renewals and reporting, handled without you being copied on everything.",
    body: [
      "Most of our management clients own in Dubai and live somewhere else. What they want is not a portal login; it is for the property to be looked after and for someone to make the small decisions without asking.",
      "We handle tenant selection and renewals, routine and emergency maintenance, inspections between tenancies, and the annual paperwork. You hear from us when something needs your judgement, and once a quarter regardless.",
    ],
    deliverables: [
      "Tenant sourcing, screening and renewal negotiation",
      "Rent collection and arrears handling",
      "Routine maintenance, emergency response and a vetted contractor list",
      "Move-in and move-out inspections with photographic records",
      "Quarterly reporting: income, costs, condition, and what we recommend",
    ],
    audience: "Overseas owners, landlords with more than one unit, and family offices.",
    intent: "advice",
    formTitle: "Discuss managing your property",
    faqs: [
      {
        question: "What happens if something breaks at 2am?",
        answer:
          "The tenant calls our line, not you. We hold a spending threshold agreed with you in advance so routine repairs are simply dealt with; anything above it comes to you with a recommendation and a quote.",
      },
      {
        question: "Can you manage a property I bought through someone else?",
        answer: "Yes. Where the property came from makes no difference to how we manage it.",
      },
    ],
  },
  {
    slug: "landlord-leasing",
    name: "Landlord & Leasing",
    title: "Landlord and leasing",
    tagline: "Let well, to the right tenant.",
    description:
      "Leasing representation for Dubai landlords — priced to the market, marketed properly, and let to a tenant who has been checked before they move in.",
    body: [
      "A void month costs more than a small difference in rent. We price to let, present the property so it competes, and screen every applicant before they reach your shortlist.",
      "You see qualified applicants with references checked, not a list of enquiries. We handle the tenancy contract, Ejari and handover, and we tell you early when a renewal is worth negotiating rather than letting it drift.",
    ],
    deliverables: [
      "Rental valuation from comparable, current lettings",
      "Photography and listing presentation that competes on the portals",
      "Applicant screening, references and affordability checks",
      "Tenancy contract, Ejari registration and documented handover",
      "Renewal strategy ahead of each anniversary, not after it",
    ],
    audience: "Owners letting a single home, and landlords with a growing portfolio.",
    intent: "advice",
    formTitle: "Let your property",
    faqs: [
      {
        question: "How quickly can you let my property?",
        answer:
          "That depends on the community, the condition and the asking rent — and we will be straight with you about all three before we list. A property priced to the current market usually moves quickly; one priced to last year's does not.",
      },
      {
        question: "Do you check tenants?",
        answer:
          "Every applicant, before they reach your shortlist: identity, employment, affordability and references. You decide from a screened list, not from raw enquiries.",
      },
    ],
  },
  {
    slug: "golden-visa",
    name: "Golden Visa",
    title: "Golden Visa support",
    tagline: "The property side, handled properly.",
    description:
      "Support for buyers whose purchase is connected to a UAE Golden Visa application — structured correctly from the start, with the visa process itself run by licensed specialists.",
    body: [
      "A property bought with a residency application in mind needs to be right on both counts. We advise on the property side: what to buy, how the purchase should be structured and documented, and what the Dubai Land Department paperwork needs to show.",
      "The visa application itself is handled by licensed immigration specialists we work alongside — not by us, and not by anyone guessing. We will introduce you, and we will not state eligibility rules or thresholds ourselves: those come from the authority and from your adviser, in writing, before you commit to anything.",
    ],
    deliverables: [
      "Property advice with the residency objective factored in from the start",
      "Purchase structured and documented with the application in mind",
      "Coordination of DLD paperwork and title documentation",
      "Introduction to licensed immigration specialists for the application itself",
      "One point of contact holding the property and visa timelines together",
    ],
    audience: "Investors and families whose Dubai purchase is tied to a residency plan.",
    intent: "relocate",
    formTitle: "Discuss a Golden Visa purchase",
    faqs: [
      {
        question: "Do you handle the visa application?",
        answer:
          "No — that is done by licensed immigration specialists, and we will introduce you to the ones we work with. What we handle is the property: choosing it, structuring the purchase and getting the documentation right so the application is not held up by our side of it.",
      },
      {
        question: "What qualifies a property for the Golden Visa?",
        answer:
          "The criteria are set by the UAE authorities and they do change, so we will not quote them at you from a web page. We will put you in front of a licensed adviser who will confirm the current requirements in writing for your circumstances, and we will make sure the property side meets them.",
      },
    ],
  },
  {
    slug: "relocation",
    name: "Relocation",
    title: "Relocating to Dubai",
    tagline: "A move, not just a move-in.",
    description:
      "Relocation support for families arriving in Dubai — the home, the neighbourhood, the school run, and the practical things nobody tells you until you get here.",
    body: [
      "Choosing a home in a city you have not lived in is guesswork unless someone tells you what it is actually like. Which communities suit young families and which suit teenagers. What the school run really costs you in the morning. Where you will and will not need a second car.",
      "We start with how your family lives, not with a list of available units — then we handle the home itself and connect you with the people who handle the rest.",
    ],
    deliverables: [
      "An honest orientation on communities, commutes and daily life",
      "A shortlist built around schools, work and how you actually spend a week",
      "Accompanied viewings, in person or on video before you fly",
      "Purchase or tenancy handled end to end",
      "Introductions for schooling, healthcare, banking and moving",
    ],
    audience: "Families and professionals moving to Dubai from abroad.",
    intent: "relocate",
    formTitle: "Plan your move",
    faqs: [
      {
        question: "Can you help before we arrive?",
        answer:
          "That is usually when we are most useful. We can walk you through communities on video, narrow the shortlist while you are still at home, and have viewings lined up for the week you land.",
      },
      {
        question: "Can you advise on schools?",
        answer:
          "We can tell you which communities put you within a sensible drive of which schools, and introduce you to advisers who specialise in placement. We will not pretend to rank schools for you — that is not our expertise, and your family's judgement matters more than a league table.",
      },
    ],
  },
  {
    slug: "investment-advisory",
    name: "Investment Advisory",
    title: "Investment advisory",
    tagline: "Held for the long view.",
    description:
      "Portfolio advice for Dubai property investors — yield and capital analysis on official Dubai Land Department data, and a strategy for what to hold, sell or restructure.",
    body: [
      "An investment decision is only as good as the evidence under it. We work from Dubai Land Department transaction records rather than agency sentiment, and we will show you the numbers we are reasoning from.",
      "That covers what to buy and where, what a realistic yield looks like after service charges rather than before them, and — for owners who already hold Dubai property — what is worth keeping and what is quietly underperforming.",
    ],
    deliverables: [
      "Area and building analysis built on DLD transaction evidence",
      "Yield modelled after service charges, not before",
      "Acquisition strategy matched to your horizon and risk appetite",
      "Portfolio review: hold, sell or restructure, with the reasoning shown",
      "Exit planning, timed to the market rather than to a quarter end",
    ],
    audience: "Investors building a Dubai position, and owners reviewing one they already hold.",
    intent: "invest",
    formTitle: "Discuss your portfolio",
    faqs: [
      {
        question: "What yield should I expect?",
        answer:
          "It varies widely by community, building and unit type, and the honest answer needs your specific situation. We will model it from comparable DLD transactions and current lettings, net of service charges — and we will show you the working rather than quoting a headline figure.",
      },
      {
        question: "Where does your data come from?",
        answer:
          "Dubai Land Department open data, cleaned into our own database, alongside what we see transacting day to day. We cite the source and the date on anything we show you. DLX is not affiliated with the Dubai Land Department.",
      },
    ],
  },
  {
    slug: "business-setup",
    name: "Business Setup",
    title: "Business setup",
    tagline: "Premises, and the people who do the rest.",
    description:
      "Support for companies establishing in Dubai — offices, retail and warehousing across the free zones and mainland, with licensing handled by specialists.",
    body: [
      "Setting up in Dubai involves two decisions that are usually made in the wrong order: which licence and jurisdiction you need, and where you will actually work. The second constrains the first more than people expect.",
      "We handle premises — office, retail or warehousing, free zone or mainland — and we work alongside licensed corporate service providers who handle formation and licensing itself. We will say plainly which parts are ours and which are theirs.",
    ],
    deliverables: [
      "Premises search across free zone and mainland options",
      "Fit-out, service charge and total occupancy cost comparison",
      "Lease negotiation and Ejari registration",
      "Introductions to licensed corporate service providers for formation",
      "Residential search for founders and relocating staff",
    ],
    audience: "Founders and companies establishing or expanding into the UAE.",
    intent: "advice",
    formTitle: "Discuss your setup",
    faqs: [
      {
        question: "Do you handle company formation and licensing?",
        answer:
          "No — that is done by licensed corporate service providers, and we will introduce you to ones we work with. We handle the premises side and keep the two timelines aligned so you are not paying rent on an office you cannot yet trade from.",
      },
      {
        question: "Free zone or mainland?",
        answer:
          "It depends on who your customers are and what you need to be licensed to do, and the answer has real consequences for premises. It is the first conversation to have with a licensed adviser, and we will make the introduction before you sign anything.",
      },
    ],
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return SERVICES.find((service) => service.slug === slug);
}
