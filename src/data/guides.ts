/**
 * The playbook.
 *
 * Editorial guides held in code rather than the database: they are the
 * brokerage's considered position, they change rarely, and keeping them here
 * means each one is type-checked, server-rendered and reviewed in a pull
 * request before it can claim anything.
 *
 * ON LEGAL, VISA AND TAX CONTENT.
 *
 * CLAUDE.md forbids inventing legal, visa or tax specifics, and these are
 * exactly the guides where a confident wrong sentence does real damage,
 * someone reads it, believes it, and structures a purchase around it. So the
 * guides that touch those areas:
 *
 *   * explain how something works and what it depends on, rather than asserting
 *     rates, thresholds and eligibility as settled fact;
 *   * take any figure they do quote from `fee-schedule.ts`, where it carries a
 *     source and a verification date; and
 *   * carry `verifyWithAuthorities`, which renders a dated note telling the
 *     reader to confirm with the authority before relying on it.
 *
 * That is not hedging. It is the difference between a guide that helps someone
 * ask the right questions and one that quietly makes their decision for them.
 */

export type GuideSection = {
  heading: string;
  /** Paragraphs. Rendered in order. */
  body: string[];
  /** An optional list rendered after the paragraphs. */
  points?: string[];
};

export type GuideFaq = { question: string; answer: string };

export type GuideCategory =
  | "buying"
  | "selling"
  | "investment"
  | "golden_visa"
  | "relocation"
  | "legal_and_tax"
  | "area_guide";

export type Guide = {
  slug: string;
  title: string;
  /** The OG line and the standfirst. */
  tagline: string;
  description: string;
  category: GuideCategory;
  /** The direct answer, for the reader in a hurry and for AI answer engines. */
  answer: string;
  /** Roughly how long it takes to read. */
  readingMinutes: number;
  /** Set for anything touching law, visas or tax. Renders the dated note. */
  verifyWithAuthorities: boolean;
  /** ISO date the content was last reviewed. */
  reviewedOn: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  /** Tools worth linking from this guide. */
  relatedTools?: string[];
  /** Services worth linking from this guide. */
  relatedServices?: string[];
};

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  buying: "Buying",
  selling: "Selling",
  investment: "Investment",
  golden_visa: "Golden Visa",
  relocation: "Relocation",
  legal_and_tax: "Legal & tax",
  area_guide: "Communities",
};

const REVIEWED = "2026-08-22";

export const GUIDES: readonly Guide[] = [
  {
    slug: "foreigner-buying-property-dubai",
    title: "Can a foreigner buy property in Dubai?",
    tagline: "Freehold, leasehold, and what the difference actually means.",
    description:
      "How foreign ownership works in Dubai, freehold and leasehold areas, what each gives you, and the practical differences that matter when you come to sell.",
    category: "buying",
    answer:
      "Yes. Dubai has designated freehold areas where foreign nationals can own property outright, and leasehold areas where they hold a long lease instead. Most of the communities international buyers know (Palm Jumeirah, Downtown, Dubai Marina) are freehold. Which category a specific property falls into is a matter of record, and it should be confirmed on the title before you commit rather than assumed from the community's reputation.",
    readingMinutes: 6,
    verifyWithAuthorities: true,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Freehold and leasehold",
        body: [
          "Dubai opened designated areas to foreign freehold ownership in the early 2000s, and those areas are where almost all international buying happens. Freehold means you own the property and, in a villa's case, the land it sits on, outright, registered in your name at the Dubai Land Department, with no time limit.",
          "Leasehold is a long lease, commonly of several decades, in areas not designated for freehold. You hold the right to occupy and to deal with the property for the term, but the underlying ownership stays with the freeholder. It is a legitimate structure and there are good properties held that way; it simply is not the same asset, and it prices differently.",
        ],
        points: [
          "Freehold: owned outright, registered in your name, no expiry.",
          "Leasehold: a long lease, with the freehold retained by another party.",
          "Which applies is determined by the area and is on the title, confirm it rather than assume it.",
        ],
      },
      {
        heading: "What to check before you commit",
        body: [
          "The title deed is the document that settles it. It states what is owned, by whom, and on what basis. A seller's description, a portal listing and an agent's summary are all secondary to what the deed says, and the deed is what a conveyancer will read first.",
          "For an apartment, the second document that matters is the service charge schedule for the building. It is not a legal question but it is a financial one, and it is the figure most often glossed over until after an offer is accepted.",
        ],
      },
      {
        heading: "Where this gets specific",
        body: [
          "The rules around foreign ownership, the designated areas and the registration process are set by the Dubai Land Department and do change. Anything that turns on your nationality, your residency status or the structure you buy through (a company, a trust, joint names) is a question for a lawyer rather than a website.",
          "What we can do is tell you what the title says, what the building costs to run, and whether the price makes sense against what has actually transacted.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to live in Dubai to buy property there?",
        answer:
          "No. Non-residents buy in Dubai routinely, and the purchase can largely be handled remotely. Some steps may require you in person or acting through a power of attorney, and that should be established at the outset rather than discovered late.",
      },
      {
        question: "Does buying property give me residency?",
        answer:
          "Not automatically. There are residency routes connected to property investment, with criteria set by the UAE authorities that change over time. Our Golden Visa guide explains how those routes work in principle, and a licensed immigration adviser will confirm your position in writing.",
      },
      {
        question: "Can I own a property jointly, or through a company?",
        answer:
          "Both are possible and both have consequences, for financing, for succession and potentially for tax in your home country. It is worth structuring deliberately at the start, with advice, rather than unpicking it later.",
      },
    ],
    relatedTools: ["buying-costs", "rental-yield"],
    relatedServices: ["buy"],
  },
  {
    slug: "golden-visa-guide",
    title: "The Dubai Golden Visa, explained",
    tagline: "How the property routes work, and what to confirm.",
    description:
      "How the UAE Golden Visa works for property buyers, the routes, family sponsorship, and what to have confirmed in writing before you structure a purchase around it.",
    category: "golden_visa",
    answer:
      "The UAE Golden Visa is a long-term renewable residency, and one of the routes to it is property investment above a threshold set by the authorities. Holders can generally sponsor a spouse and children. The thresholds, the conditions attached to mortgaged and off-plan properties, and the documentation all change, so the practical answer is to have a licensed immigration adviser confirm your position in writing before you buy on the strength of it.",
    readingMinutes: 7,
    verifyWithAuthorities: true,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "What it is",
        body: [
          "The Golden Visa is a long-term residency permit, renewable, that does not require an employer sponsor. That last part is what makes it valuable: conventional UAE residency is tied to employment, and ends when the employment does.",
          "There are several routes to one, for investors, entrepreneurs, specialised talent, and property owners among them. This guide covers the property route, because that is the one we can actually help with.",
        ],
      },
      {
        heading: "The property route in principle",
        body: [
          "The property route turns on the value of what you own in Dubai, at or above a threshold set by the UAE authorities. Above that, the residency runs for a long term and is renewable while the qualifying conditions hold.",
          "Several things commonly affect an application beyond the headline value: whether the property is mortgaged, whether it is completed or off-plan, and whether the value is met by one property or several. Each of these is exactly the sort of detail that changes, and exactly the sort you want confirmed before you commit to a purchase.",
        ],
        points: [
          "Value is assessed on what you own, not what you have agreed to pay.",
          "Mortgaged purchases can carry additional conditions.",
          "Off-plan timing depends on completion and registration.",
          "Renewal depends on continuing to hold the qualifying property.",
        ],
      },
      {
        heading: "Family sponsorship",
        body: [
          "A holder can generally sponsor immediate family (a spouse and children) and in some circumstances domestic staff. The conditions attached to children in particular, around age and dependency, are the ones most often assumed rather than checked.",
          "If the residency is the point of the purchase for your family, establish what each member's position will be before you choose the property, not after.",
        ],
      },
      {
        heading: "What DLX does and does not do",
        body: [
          "We advise on the property: what to buy with a residency objective in mind, how the purchase should be structured and documented, and making sure the Dubai Land Department paperwork supports rather than delays an application.",
          "We do not process visa applications and we will not tell you whether you qualify. We work alongside licensed immigration specialists and will introduce you. Anyone willing to guarantee you a visa from a property listing is not someone to take advice from.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much property do I need to own?",
        answer:
          "There is a threshold set by the UAE authorities, and it has changed more than once. Rather than quote a figure that may be out of date by the time you read this, we would point you to a licensed adviser who will confirm the current requirement in writing for your circumstances, and our eligibility checker will show you where a given purchase sits against commonly cited thresholds in the meantime.",
      },
      {
        question: "Can I get one on an off-plan property?",
        answer:
          "Off-plan purchases are treated differently, and timing matters. What has to be completed and registered before an application can proceed is the key question. Ask your adviser this before you reserve a unit, not after.",
      },
      {
        question: "What happens if I sell the property?",
        answer:
          "The residency is tied to continuing to meet the qualifying conditions, so selling has consequences for it. If you are considering an exit, take advice on the visa position at the same time as the sale, not afterwards.",
      },
    ],
    relatedTools: ["golden-visa-eligibility", "buying-costs"],
    relatedServices: ["golden-visa", "relocation"],
  },
  {
    slug: "buying-process-overseas-buyers",
    title: "Buying in Dubai from abroad",
    tagline: "The process, step by step, without being in the country.",
    description:
      "The Dubai buying process for overseas buyers, from offer to Dubai Land Department transfer, including what can be handled remotely and what cannot.",
    category: "buying",
    answer:
      "A Dubai purchase runs from offer, to a signed Memorandum of Understanding with a deposit, to a developer No Objection Certificate, to transfer at a Dubai Land Department registration trustee office. Most of it can be handled remotely, with a power of attorney covering the steps that need someone present. A cash purchase of a ready property commonly completes within about a month; off-plan and mortgaged purchases take longer.",
    readingMinutes: 8,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Before you offer",
        body: [
          "Two pieces of due diligence are worth doing before you make an offer rather than after. The first is the title: what is actually being sold, by whom, and free of what. The second is the service charge schedule, which determines what the property costs you to hold and is the single most common late surprise.",
          "For an off-plan purchase the equivalent questions are about the developer, their delivery record, the escrow arrangements, and what the payment plan actually commits you to.",
        ],
      },
      {
        heading: "Offer to contract",
        body: [
          "An accepted offer is followed by a Memorandum of Understanding (the sale contract) and a deposit, conventionally 10%, held by the agent or a trustee rather than passed to the seller. The MOU sets the completion date and what happens if either side fails to complete.",
          "This is the point at which the terms are actually fixed, and the point at which having someone on your side of the table matters most.",
        ],
      },
      {
        heading: "No Objection Certificate",
        body: [
          "The developer issues a No Objection Certificate confirming service charges are settled and they have no objection to the transfer. Getting it takes days rather than weeks, but developers vary considerably in how quickly they move and what they charge for it.",
          "This is a common source of delay, and it is worth starting early rather than at the point everything else is ready.",
        ],
      },
      {
        heading: "Transfer",
        body: [
          "Transfer happens at a Dubai Land Department registration trustee office. The balance is paid, the fees are settled, and the title deed is issued in your name. It is a same-day process when everything is in order.",
          "If you cannot attend, a properly drafted power of attorney lets someone act for you. It must be prepared and attested correctly. This is the step most likely to derail a remote purchase, and it needs to be set up early.",
        ],
        points: [
          "Balance and fees paid at the trustee office.",
          "Title deed issued in your name the same day.",
          "A power of attorney can cover your attendance, if prepared properly and in advance.",
        ],
      },
      {
        heading: "How long it takes",
        body: [
          "A cash purchase of a ready property, with the paperwork in order, commonly completes within about a month of the MOU. A mortgaged purchase depends on the lender and takes longer. An off-plan purchase completes at handover, which may be years away.",
          "The timeline is usually set by the slowest party, and it is rarely the buyer.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I complete a purchase without coming to Dubai?",
        answer:
          "In most cases yes, through a power of attorney. It has to be drafted and attested correctly, which takes time and is the single most common cause of a delayed remote completion. Start it early.",
      },
      {
        question: "How much deposit do I need?",
        answer:
          "Conventionally 10% at the point of signing the sale contract, held by the agent or a trustee rather than paid to the seller. It is negotiable in principle and it should be held properly in every case.",
      },
      {
        question: "What if the seller pulls out?",
        answer:
          "The sale contract sets out what happens, which is why its terms matter more than they appear to at the time. Have someone read it who is acting for you.",
      },
    ],
    relatedTools: ["buying-costs", "currency-converter"],
    relatedServices: ["buy", "relocation"],
  },
  {
    slug: "off-plan-vs-ready",
    title: "Off-plan or ready?",
    tagline: "Two different purchases, not two prices for the same one.",
    description:
      "Off-plan against ready property in Dubai, payment plans, delivery risk, rental income and the questions worth asking before you choose.",
    category: "investment",
    answer:
      "Ready property gives you an asset you can inspect and rent immediately, at a price that reflects both. Off-plan gives you a staged payment plan and the possibility of buying below completed value, in exchange for delivery risk and no income until handover. Which is right depends less on the market than on whether you need the property to earn from day one.",
    readingMinutes: 6,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "What you are actually choosing between",
        body: [
          "A ready property is a known quantity. You can walk through it, read its service charge history, see what the building is like at eight in the morning, and rent it the month you own it. You pay for that certainty.",
          "An off-plan property is a contract for something that does not exist yet, bought on a staged payment plan. What you gain is time to pay and, sometimes, a price below what the finished product is worth. What you accept is that delivery dates move, the finished product may differ from the render, and nothing comes in until handover.",
        ],
      },
      {
        heading: "The payment plan is the product",
        body: [
          "Off-plan plans are marketed in shorthand: 60/40, post-handover, 1% monthly. The shorthand hides what matters. The real questions are how much falls due before handover, when each instalment lands, and whether the post-handover portion carries a cost.",
          "A plan requiring most of the money before you hold anything is a very different commitment from one weighted after handover, however similar the headline sounds.",
        ],
        points: [
          "How much is due before handover?",
          "When does each instalment actually fall due, dates, or construction milestones?",
          "Is the post-handover portion interest-free?",
          "What happens if handover slips?",
        ],
      },
      {
        heading: "Delivery risk, honestly",
        body: [
          "Dubai's escrow arrangements exist precisely because delivery risk is real. They protect your money considerably better than they used to. What they do not do is deliver your building on time.",
          "The developer's record is the best available evidence, and it is worth more than any brochure. We will tell you what we know of it, including when we think you should look elsewhere.",
        ],
      },
      {
        heading: "Which suits you",
        body: [
          "If you need income from the property, or you are buying somewhere to live in soon, ready is usually the answer. If you are building a position over several years and the staged payments suit your cash flow, off-plan can be the better structure.",
          "The mistake is choosing off-plan purely because the entry price looks lower. It is lower because you are buying something that does not exist yet.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is off-plan cheaper?",
        answer:
          "The entry price is usually lower, and the payment is spread. Whether it is cheaper depends on what the property is worth at handover, which nobody knows in advance. Treat a discount to completed value as compensation for risk, not as a free gain.",
      },
      {
        question: "What protects my money on an off-plan purchase?",
        answer:
          "Payments go into a project escrow account rather than to the developer directly, and are released against construction progress. It is a meaningful protection. It is not a guarantee of the delivery date.",
      },
      {
        question: "Can I sell before handover?",
        answer:
          "Often yes, subject to the developer's rules, many require a percentage to be paid before they will allow a transfer, and they charge for it. Check that in the contract before you buy if an early exit is part of your plan.",
      },
    ],
    relatedTools: ["payment-plan", "rental-yield"],
    relatedServices: ["buy", "investment-advisory"],
  },
  {
    slug: "buying-costs-and-fees",
    title: "What buying in Dubai actually costs",
    tagline: "Every fee on top of the price, named.",
    description:
      "The full cost of buying in Dubai beyond the price: Dubai Land Department transfer fee, agency commission, trustee and NOC fees, and which of them are negotiable.",
    category: "buying",
    answer:
      "Budget for roughly 6 to 7 per cent above the purchase price on a cash purchase of a ready property. The Dubai Land Department transfer fee is 4 per cent and fixed; agency commission is conventionally 2 per cent and negotiable; and trustee, developer NOC and title deed fees add a few thousand dirhams between them. Mortgage costs are additional.",
    readingMinutes: 5,
    verifyWithAuthorities: true,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "The fixed one",
        body: [
          "The Dubai Land Department charges 4 per cent of the purchase price to register the transfer. Convention says it is split between buyer and seller; practice says the buyer pays it. Assume you are paying it unless your contract says otherwise, and treat any assurance to the contrary as something to get in writing.",
          "This is the one figure in a Dubai purchase that is genuinely fixed and not open to negotiation.",
        ],
      },
      {
        heading: "The negotiable ones",
        body: [
          "Agency commission is conventionally 2 per cent plus VAT. It is negotiable, and what you are paying should be agreed in writing before you commit to anything, not raised at the point of transfer.",
          "Registration trustee fees are tiered by price band. Developer No Objection Certificate fees vary substantially between developers and are a common late surprise: ask your developer for the figure early.",
        ],
        points: [
          "Agency commission, negotiable, agree it in writing up front.",
          "Trustee fee, tiered by price, confirm with the trustee office.",
          "Developer NOC, varies by developer, ask early.",
          "Title deed issuance, a small administrative charge.",
        ],
      },
      {
        heading: "What people forget",
        body: [
          "Service charges start from the transfer date, not from when you move in. On an apartment they are the largest ongoing cost of ownership and vary enormously by building.",
          "If you are borrowing, arrangement and valuation fees are additional. If you are buying remotely, a power of attorney has a cost. And a conveyancer, while optional, is worth the fee on a first or remote purchase.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is the 4% DLD fee negotiable?",
        answer:
          "No. It is set by the Dubai Land Department. Who pays it is a matter of contract, but the fee itself is fixed.",
      },
      {
        question: "Can I negotiate the agency commission?",
        answer:
          "Yes. It is a fee for a service, and like any fee it is open to discussion. What matters more is that it is agreed in writing before you are committed, so it is not a conversation you are having under time pressure at the end.",
      },
      {
        question: "Are these figures current?",
        answer:
          "Our buying cost calculator carries the date each figure was last checked, and every fee that varies in practice is editable so you can put your own numbers in. Confirm current fees with the Dubai Land Department and your developer before relying on any of them.",
      },
    ],
    relatedTools: ["buying-costs", "rent-vs-buy"],
    relatedServices: ["buy"],
  },
  {
    slug: "dubai-property-tax-guide",
    title: "Property and tax in Dubai",
    tagline: "What the UAE charges, and why your own country still matters.",
    description:
      "How property taxation works in Dubai for international owners, what the UAE levies, and why your tax position at home is the question that actually needs advice.",
    category: "legal_and_tax",
    answer:
      "The UAE does not levy an annual property tax or a personal income tax on rental income in the way many countries do, which is a large part of Dubai's appeal to international buyers. That does not make a Dubai property tax-free for you: your liability generally depends on where you are tax resident, and that is a question for an adviser in your own country, not for a Dubai brokerage.",
    readingMinutes: 5,
    verifyWithAuthorities: true,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Why people ask",
        body: [
          "The absence of personal income tax is one of the most cited reasons international buyers look at Dubai, and it is a genuine feature of the UAE system rather than a marketing line.",
          "Where it gets misread is in the leap from 'the UAE does not tax this' to 'this is not taxed'. Those are different statements, and the difference can be expensive.",
        ],
      },
      {
        heading: "Your residence is what decides it",
        body: [
          "Most countries tax their residents on worldwide income, which can include rent from a Dubai property and gains on selling it. Whether yours does, at what rate, and whether any double taxation agreement applies, depends on your circumstances.",
          "That is not a question a property website can answer, and any site that answers it confidently for you is one to be careful of. It is a question for a tax adviser in the country where you are resident.",
        ],
      },
      {
        heading: "What is charged in the UAE",
        body: [
          "Transaction costs are real and are covered in our buying costs guide, the Dubai Land Department transfer fee being the largest. Service charges are an ongoing cost of ownership. VAT applies to some transactions and services rather than to residential sales generally.",
          "The UAE has also introduced corporate taxation, which can be relevant if you hold property through a company. If you are considering a corporate structure, take advice on it before you buy rather than restructuring afterwards.",
        ],
      },
      {
        heading: "What we will and will not tell you",
        body: [
          "We will tell you what a purchase costs in transaction fees and what a property costs to hold, because those are matters of record we can evidence.",
          "We will not advise you on your tax position, in the UAE or at home. We will happily work alongside your adviser, and we will tell you plainly when a question needs one.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is rental income from Dubai taxed?",
        answer:
          "The UAE does not levy personal income tax on it in the way many countries do. Whether it is taxable for you depends on where you are tax resident, and that is a question for an adviser in your own country.",
      },
      {
        question: "Is there an annual property tax?",
        answer:
          "The UAE does not levy an annual property tax of the kind common elsewhere. Service charges are an ongoing cost, but they are a building charge for maintaining the property, not a tax.",
      },
      {
        question: "Should I buy through a company?",
        answer:
          "It depends on your circumstances, and it has consequences for financing, succession, UAE corporate tax and your position at home. Take advice before you buy. It is considerably harder to restructure afterwards.",
      },
    ],
    relatedTools: ["buying-costs", "rental-yield"],
    relatedServices: ["investment-advisory", "business-setup"],
  },
  {
    slug: "service-charges-explained",
    title: "Service charges, explained",
    tagline: "The cost that decides your real yield.",
    description:
      "How Dubai service charges work, what drives them, and why they are the difference between a headline rental yield and what actually reaches you.",
    category: "investment",
    answer:
      "Service charges are the annual cost of running your building, charged per square foot and set per project. In Dubai they range from single digits per square foot to well over thirty, and they come straight off your rental income, which is why a gross yield quoted without them is close to meaningless. Get the actual figure for your building before you buy.",
    readingMinutes: 5,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "What they pay for",
        body: [
          "Service charges cover the building's shared costs: maintenance, security, cleaning, insurance, the pool and gym, chilled water infrastructure, and a reserve fund for major works. They are charged per square foot of your unit, per year.",
          "They are approved per project and published by the Dubai Land Department, which means the figure for a specific building is a matter of record rather than something to be estimated.",
        ],
      },
      {
        heading: "Why the range is so wide",
        body: [
          "A simple low-rise block with a small lobby costs a fraction of a serviced tower with a concierge, multiple pools, a chilled-water plant and extensive shared amenity. Both are legitimate; they are simply different products with different running costs.",
          "The trap is comparing two properties on price per square foot without comparing what they cost to hold. A cheaper apartment in an expensive building can easily be the worse purchase.",
        ],
      },
      {
        heading: "What it does to yield",
        body: [
          "Service charges come off rental income before anything reaches you. On a typical apartment they can account for one to two percentage points of yield, sometimes more, which is often the entire difference between the yield quoted in a listing and the yield you actually receive.",
          "Our yield calculator takes them off explicitly for exactly this reason. Put the real figure for your building in and the answer changes.",
        ],
      },
      {
        heading: "What to ask",
        body: [
          "Ask for the current approved figure per square foot, the last three years of it, and whether any major works are anticipated. A building that has under-collected for years and faces a large reserve contribution is a liability that does not show up in the asking price.",
        ],
        points: [
          "The current approved rate per square foot.",
          "The trend over the last three years.",
          "The state of the reserve fund.",
          "Any anticipated major works.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much are service charges in Dubai?",
        answer:
          "They vary from single digits per square foot per year to well over thirty, depending entirely on the building and its amenities. There is no useful average, the figure that matters is the one for the specific building you are buying in, and it is published per project.",
      },
      {
        question: "Can service charges go up?",
        answer:
          "Yes. They are reviewed and approved periodically, and they generally rise over time. A building facing major works can see a sharp increase, which is why the reserve fund is worth asking about.",
      },
      {
        question: "Who pays them, the owner or the tenant?",
        answer:
          "The owner. That is precisely why they matter to your yield, the rent your tenant pays is not what you keep.",
      },
    ],
    relatedTools: ["rental-yield", "yield-comparison"],
    relatedServices: ["property-management", "investment-advisory"],
  },
  {
    slug: "relocating-to-dubai",
    title: "Moving to Dubai: the practical order",
    tagline: "The practical order to do things in.",
    description:
      "A practical guide to relocating to Dubai, choosing where to live, schools and commutes, and the sequence that makes a move less painful.",
    category: "relocation",
    answer:
      "Choose the community before the property, and choose it around the school run and the commute rather than the show apartment. Most families who regret a Dubai move regret the location, not the home. Rent for the first year unless you already know the city well. It is far cheaper than buying in the wrong place.",
    readingMinutes: 7,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Sequence matters",
        body: [
          "The order most people do this in is: find a property they like, then discover what living there is actually like. Reversing that is the single most useful thing we can tell you.",
          "Start from how your week actually runs. Where does work take you, and at what times? Which schools are realistic, and what does that drive look like at half past seven in the morning? How often will you genuinely use the beach, as opposed to how often you imagine you will?",
        ],
      },
      {
        heading: "Rent first, usually",
        body: [
          "Unless you already know Dubai well, renting for a year is almost always the right call. It costs a year's rent; buying in the wrong community costs considerably more, and takes longer to undo.",
          "A year gives you the thing no amount of research provides: knowing what a place is like in August, what the traffic does in term time, and whether the community you liked on a Saturday works on a Tuesday.",
        ],
      },
      {
        heading: "Schools and the commute",
        body: [
          "School places drive location for most families, and the good ones fill early. Start that process before you choose where to live, not after, it constrains the map more than anything else.",
          "Dubai's road network is good and its distances are deceptive. A community twenty minutes away at ten in the morning can be fifty at eight. Drive the route at the time you would actually drive it.",
        ],
      },
      {
        heading: "The practical list",
        body: [
          "Residency and the Emirates ID come first and gate much of the rest, a bank account, a tenancy in your name, utilities. Employers usually handle the visa; if you are arriving independently, get advice on the route that fits you.",
          "We handle the home and connect you with people who handle the rest. We do not process visas, place children in schools, or move your furniture, and we will say so rather than pretend otherwise.",
        ],
        points: [
          "Residency and Emirates ID, usually employer-led.",
          "Bank account, generally needs the Emirates ID.",
          "Tenancy and Ejari registration.",
          "Utilities, internet, and a driving licence.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I rent or buy when I first move?",
        answer:
          "Rent, unless you already know Dubai well. A year of renting is cheap compared with buying in a community that turns out not to suit your family, and it is far easier to undo.",
      },
      {
        question: "How far in advance should I start?",
        answer:
          "For schools, as early as you can, places at the sought-after ones go early. For a home, four to six weeks before you need to move is about right.",
      },
      {
        question: "Can you help before we arrive?",
        answer:
          "That is usually when we are most useful. We can walk you through communities on video, narrow the shortlist while you are still at home, and have viewings arranged for the week you land.",
      },
    ],
    relatedTools: ["rent-vs-buy", "currency-converter"],
    relatedServices: ["relocation", "rent"],
  },
  {
    slug: "dubai-community-guide",
    title: "Which Dubai community suits you?",
    tagline: "What the prime districts are actually like to live in.",
    description:
      "An honest guide to Dubai's prime residential communities, who each one suits, what living there is like, and what the recorded numbers say.",
    category: "area_guide",
    answer:
      "Dubai's prime communities divide roughly into waterfront (Palm Jumeirah, Dubai Marina), central (Downtown, Business Bay) and family-oriented master communities (Dubai Hills Estate, Arabian Ranches). Waterfront and central buy you location and liquidity at a price; master communities buy you space, schools and quiet. The recorded transaction data for each is on its community page.",
    readingMinutes: 8,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Waterfront",
        body: [
          "Palm Jumeirah and Dubai Marina are what most people picture. Palm Jumeirah is villas and low-rise apartments with beach access, quieter than its reputation, and priced accordingly, it commands the highest price per square foot of any established Dubai community and yields the least, which is the trade every prime market makes.",
          "Dubai Marina is dense, walkable by Dubai standards, and the most consistently rentable postcode in the city. It suits people who want life on the doorstep and are content with an apartment.",
        ],
      },
      {
        heading: "Central",
        body: [
          "Downtown Dubai is the Burj Khalifa, the Opera District and the Dubai Mall, and it prices for that. It rents well and it sells well, and you are paying for an address that does not need explaining anywhere in the world.",
          "Business Bay sits alongside it, more mixed-use and generally better value per square foot, with yields that reflect a rental market driven by professionals rather than tourists.",
        ],
      },
      {
        heading: "Family master communities",
        body: [
          "Dubai Hills Estate, Arabian Ranches and their peers are where families end up. Villas and townhouses, schools inside or adjacent to the community, parks, and a pace that is nothing like the Marina.",
          "They yield less than apartment districts and they transact less often, which is worth knowing if liquidity matters to you. What they offer is space and a life that works with children in it.",
        ],
      },
      {
        heading: "How to choose",
        body: [
          "The numbers will narrow the field, and each community page here carries its recorded prices, yields and volumes. What the numbers cannot tell you is whether you will enjoy living there.",
          "Visit at the time of day you would actually be there. A community is a different place on a Friday evening and a Tuesday morning, and both of them are your life.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which Dubai community has the best rental yield?",
        answer:
          "Generally the more affordable apartment communities rather than the prime waterfront ones, yield and prestige tend to move in opposite directions. Our community comparison tool ranks them on recorded evidence, and the figures come from registered transactions rather than opinion.",
      },
      {
        question: "Which is best for families?",
        answer:
          "The master communities, Dubai Hills Estate and its peers, for space, schools and quiet. Which one depends on where the school run and the commute take you, which is a conversation rather than a list.",
      },
      {
        question: "Where should I buy for capital growth?",
        answer:
          "Past growth is recorded and we show it; future growth is a forecast and we will not pretend to have one. What we can do is tell you which communities have been moving, what supply is coming, and where we think the risk sits.",
      },
    ],
    relatedTools: ["yield-comparison", "best-areas"],
    relatedServices: ["buy", "investment-advisory"],
  },
  {
    slug: "cost-of-living-dubai",
    title: "The cost of living in Dubai",
    tagline: "What a month actually costs.",
    description:
      "A practical snapshot of living costs in Dubai for relocating families and professionals, housing, schooling, transport and the things people underestimate.",
    category: "relocation",
    answer:
      "Housing and schooling dominate a Dubai household budget, and both vary enormously by choice, the same family can spend very different amounts depending on community and school. Utilities, transport and groceries are broadly comparable to a major Western city. The costs people underestimate are school fees, annual rent paid in few cheques, and the cost of running a car in a city built around driving.",
    readingMinutes: 6,
    verifyWithAuthorities: false,
    reviewedOn: REVIEWED,
    sections: [
      {
        heading: "Housing dominates",
        body: [
          "Rent is the largest line in almost every Dubai budget, and the range is enormous, the same square footage costs multiples more on the Palm than in an outer community. That is a genuine choice rather than a fixed cost.",
          "The structure catches people out more than the amount. Dubai rent is conventionally paid annually, in a small number of cheques, which means arriving with a year's rent available rather than a month's. Ask what cheque structure a landlord will accept before you commit to a budget.",
        ],
      },
      {
        heading: "Schooling",
        body: [
          "For families with children this is often the second-largest cost and sometimes the largest. Fees vary widely by school and by curriculum, and the sought-after schools cost accordingly.",
          "Budget for the fees and for what surrounds them, registration, uniforms, transport and trips add up to more than people expect.",
        ],
      },
      {
        heading: "The rest",
        body: [
          "Utilities are moderate, though summer cooling is the significant one, a large villa cools expensively between June and September, and it surprises people every year.",
          "Dubai is built around driving. A car, its insurance, fuel and tolls are a real monthly cost, and public transport, while good on the routes it covers, does not cover everywhere you will want to go.",
          "Groceries and eating out span the full range, from very reasonable to as expensive as you like. This is the part of the budget you control.",
        ],
      },
      {
        heading: "What we can tell you",
        body: [
          "We can tell you what a specific property costs to rent or to hold, including its service charges, because those are matters of record.",
          "For schools, healthcare and the rest, we will introduce you to people who know them properly rather than guess at figures. A number quoted confidently and wrongly is worse than no number.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Dubai expensive to live in?",
        answer:
          "It depends almost entirely on housing and schooling, both of which span an enormous range. A family can live comfortably in Dubai for considerably less than in London or New York, or for considerably more, the choices you make about community and school decide it.",
      },
      {
        question: "Do I need to pay a year's rent upfront?",
        answer:
          "Dubai rent is conventionally paid annually in a small number of cheques, though more landlords now accept a greater number. It is worth establishing what a landlord will accept before you set your budget.",
      },
      {
        question: "How much should I budget for utilities?",
        answer:
          "Moderate for most of the year, with summer cooling the significant variable, a large villa costs meaningfully more to cool between June and September than a well-insulated apartment.",
      },
    ],
    relatedTools: ["rent-vs-buy", "currency-converter"],
    relatedServices: ["relocation", "rent"],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function guidesByCategory(category: GuideCategory): Guide[] {
  return GUIDES.filter((guide) => guide.category === category);
}

/** Categories that actually have guides, in a sensible reading order. */
export function activeGuideCategories(): GuideCategory[] {
  const order: GuideCategory[] = [
    "buying",
    "investment",
    "golden_visa",
    "relocation",
    "legal_and_tax",
    "area_guide",
    "selling",
  ];
  return order.filter((category) => GUIDES.some((guide) => guide.category === category));
}

/**
 * The anchor id for a section heading.
 *
 * Shared so the contents rail and the section it points at can never drift
 * apart, a table of contents with a dead link is worse than none.
 */
export function sectionAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Guides worth reading next: same category first, then the rest of the
 * playbook, never the guide you are already on.
 */
export function relatedGuides(slug: string, limit = 3): Guide[] {
  const current = guideBySlug(slug);
  if (!current) return GUIDES.slice(0, limit);

  const sameCategory = GUIDES.filter(
    (guide) => guide.slug !== slug && guide.category === current.category,
  );
  const others = GUIDES.filter(
    (guide) => guide.slug !== slug && guide.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/**
 * The share card for a guide.
 *
 * Generated by `scripts/generate-og.mjs` from this same registry, so a card can
 * never describe a guide differently from its own meta tags.
 */
export function guideOgPath(slug: string): string {
  return `/og/guides/${slug}.png`;
}
