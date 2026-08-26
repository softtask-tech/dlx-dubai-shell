/**
 * English, the source of truth.
 *
 * Every other dictionary is typed against this one, so a missing key is a build
 * error rather than an English sentence appearing mid-paragraph in Arabic.
 *
 * A note on how the translations were written. These are not the English
 * sentences run through a dictionary. Each language gets the argument made the
 * way that reader expects to hear it: the Arabic leans on standing, licence and
 * the long relationship; the Hindi and the Russian lead with the numbers,
 * because those readers arrive having already done arithmetic; the Chinese is
 * shorter than the English everywhere, because a Chinese luxury brand that
 * writes long reads as a brand explaining itself. The claims underneath are
 * identical in all five, only the emphasis moves.
 */
import { brand } from "../config/brand.ts";

export const en = {
  /** Page metadata for the localised pages. Titles stay unique per language. */
  meta: {
    "/": {
      title: "DLX Properties, Dubai real estate, handled with intention",
      description:
        "A private Dubai brokerage advising on prime residential acquisitions, off-market sales and long-term portfolio strategy. RERA ORN 40905.",
      tagline: "Dubai real estate, handled with intention.",
    },
    "/about": {
      title: "About DLX",
      description:
        "A small Dubai brokerage that represents a limited number of clients at a time. Licensed under RERA ORN 40905, working from Business Bay.",
      tagline: "Fewer clients, handled properly.",
    },
    "/services": {
      title: "Services",
      description:
        "Acquisition, disposal, portfolio strategy, Golden Visa guidance and relocation support for private owners and family offices in Dubai.",
      tagline: "What we do, and how we charge for it.",
    },
    "/tools": {
      title: "Calculators",
      description:
        "Work out your true buying costs, rental yield, mortgage payments and Golden Visa eligibility with Dubai's actual fee schedule.",
      tagline: "Run the numbers before you speak to anyone.",
    },
    "/contact": {
      title: "Contact",
      description:
        "Speak to a DLX consultant about buying, selling or relocating to Dubai. A person replies personally, usually the same day.",
      tagline: "A conversation, not a sales call.",
    },
  },

  nav: {
    home: "Home",
    properties: "Properties",
    services: "Services",
    marketIntelligence: "Market Intelligence",
    areas: "Areas",
    tools: "Calculators",
    developers: "Developers",
    team: "Team",
    guides: "Guides",
    blog: "Journal",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    openMenu: "Menu",
    closeMenu: "Close",
    primaryLabel: "Primary",
    homeAria: "DLX Properties, home",
    skipToContent: "Skip to content",
  },

  common: {
    view: "View",
    viewAll: "View all",
    readMore: "Read more",
    inEnglish: "in English",
    /** Title text on the marker above, read out, so it says the whole thing. */
    inEnglishTitle: "This page is only published in English.",
    loading: "Loading…",
    close: "Close",
    source: "Source",
    updated: "Updated",
  },

  home: {
    eyebrow: "Dubai · Private Brokerage",
    /** Rendered one line at a time; the last line takes the accent. */
    headline: ["Dubai real estate,", "handled with"],
    headlineAccent: "intention.",
    ctaPortfolio: "View Portfolio",
    ctaConsult: "Private consultation",
    practiceEyebrow: "The practice",
    practiceStatement:
      "We represent a small number of clients across Dubai's prime districts, advising quietly, negotiating precisely, and holding a long view of value.",
    practiceSupport:
      "Acquisition, disposal and portfolio strategy for private owners, family offices and first-time buyers into the emirate.",
    disciplines: {
      sales: "Private Sales",
      advisory: "Advisory & Services",
      market: "Market Intelligence",
      guides: "Guides",
    },
    selectedEyebrow: "Selected",
    selectedTitle: "From the portfolio",
    selectedLink: "View all properties",
    closingTitle: "Begin a quiet conversation.",
    closingBody:
      "Whether you are acquiring, exiting or simply observing the market, our team is available for a discreet, no-obligation discussion.",
    closingCta: "Contact DLX",
    faq: [
      {
        question: "Is DLX Properties a licensed Dubai brokerage?",
        answer: `Yes. ${brand.name} trades under RERA Office Registration Number ${brand.reraOrn} and works from ${brand.address.street}, ${brand.address.locality}. Every transaction we handle runs through the Dubai Land Department's official process.`,
      },
      {
        question: "What does DLX actually do for a client?",
        answer:
          "Three things: acquisition, disposal and portfolio strategy. We represent a small number of clients at a time, sourcing and negotiating on a purchase, running a discreet sale, or advising owners on what to hold, sell or restructure.",
      },
      {
        question: "Do I need to be in Dubai to buy?",
        answer:
          "No. Much of our client base buys from abroad, and we are set up to represent buyers remotely, viewings, due diligence and negotiation handled on your behalf. Where a step legally requires you in person or through a power of attorney, we will tell you before you commit to anything.",
      },
    ],
  },

  about: {
    eyebrow: "About",
    title: "Fewer clients, handled properly.",
    lead: "DLX is deliberately small. We take on a limited number of mandates at a time because the alternative, a pipeline of a hundred half-served buyers, is how most brokerages work and why most buyers feel unrepresented.",
    licenceEyebrow: "Licence",
    licenceBody: `${brand.name} is licensed by the Dubai Land Department's regulator, RERA, under Office Registration Number ${brand.reraOrn}. Our office is in ${brand.address.street}, ${brand.address.locality}. Every transaction runs through the Land Department's official process, and every figure we publish is sourced and dated.`,
    principlesEyebrow: "How we work",
    principles: [
      {
        title: "We tell you what the number actually is.",
        body: "Transfer fees, agency commission, service charges, the mortgage registration you did not budget for. The full cost of a purchase, before you commit to it.",
      },
      {
        title: "We say no.",
        body: "If a building has a service-charge problem or a developer has a delivery record we would not accept ourselves, you will hear it, including when saying so costs us the transaction.",
      },
      {
        title: "We stay after the transfer.",
        body: "Handover, snagging, leasing, resale timing. The relationship a brokerage has with a client is worth more than the commission on one deal, and behaving that way is the whole strategy.",
      },
    ],
    ctaTitle: "Talk to someone who will answer.",
    ctaBody: "No call centre, no queue. A consultant reads what you send and replies personally.",
    ctaButton: "Contact DLX",
  },

  services: {
    eyebrow: "Services",
    title: "What we do, and how we charge for it.",
    lead: "Five practices, one team. Each one is a mandate we take on properly or not at all.",
    detailLink: "Read the detail",
    ctaTitle: "Not sure which of these you need?",
    ctaBody:
      "Describe the situation in a sentence or two. A consultant will tell you what is actually involved, including when the answer is that you do not need us yet.",
    ctaButton: "Start a conversation",
  },

  tools: {
    eyebrow: "Calculators",
    title: "Run the numbers before you speak to anyone.",
    lead: "Every calculator here uses Dubai's real fee schedule, dated and sourced. Nothing asks for your details to show you a result.",
    openTool: "Open calculator",
    noteTitle: "The calculators themselves are in English.",
    noteBody:
      "The figures are the same in any language, Dubai's fee schedule does not change with the reader. If you would rather work through them with someone in your own language, ask our advisor or speak to a consultant.",
    ctaButton: "Ask a consultant",
  },

  contact: {
    eyebrow: "Contact",
    title: "A conversation, not a sales call.",
    lead: "Tell us what you are trying to do. A consultant reads it personally and replies, usually the same day, always with something useful rather than a request for a call.",
    officeEyebrow: "Office",
    hoursEyebrow: "Hours",
    hoursBody:
      "Sunday to Thursday, 9am - 6pm Gulf Standard Time. Messages are read at weekends too.",
    directEyebrow: "Direct",
    licenceLine: `RERA ORN ${brand.reraOrn}`,
  },

  footer: {
    closing: "Talk to someone who will answer.",
    closingCta: "Contact DLX",
    tagline: brand.tagline,
    exploreHeading: "Explore",
    contactHeading: "Contact",
    legalHeading: "Legal",
    licence: `RERA ORN ${brand.reraOrn}`,
    rights: "All rights reserved.",
    languageHeading: "Language",
  },

  form: {
    stepOf: "Step {current} of {total}",
    title: "Start a conversation",
    description:
      "Tell us what you're looking for. A consultant replies personally, usually the same day.",
    intentLegend: "What brings you to DLX?",
    intents: {
      buy: "Buy a home",
      invest: "Invest",
      sell: "Sell a property",
      rent: "Rent",
      relocate: "Relocate to Dubai",
      advice: "Just exploring",
    },
    timelineLegend: "When are you looking to move?",
    timelines: {
      immediately: "Ready now",
      within_3_months: "Next 3 months",
      within_12_months: "This year",
      researching: "Researching",
    },
    budgetLabel: "Budget",
    budgetHint: "A rough band is plenty, it helps us send you the right things.",
    budgetSkip: "Rather not say",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone",
    phoneHint: "Include your country code.",
    contactPreferenceLabel: "Best way to reach you",
    contactPreferences: {
      none: "No preference",
      email: "Email",
      phone: "Phone",
      whatsapp: "WhatsApp",
    },
    messageLabel: "Anything else we should know?",
    continue: "Continue",
    back: "Back",
    skipToDetails: "Skip to contact details",
    submit: "Send enquiry",
    submitting: "Sending…",
    needContact: "Give us an email address or a phone number so we can reply.",
    failed:
      "Something went wrong sending that. Try again, or email us directly and we'll pick it up.",
    privacyNote:
      "We use your details to reply to this enquiry and nothing else. No lists, no sharing.",
    sentEyebrow: "Received",
    sentTitle: "Thank you, that's with us.",
    sentBody:
      "A consultant will read this personally and come back to you, usually the same day. A confirmation is on its way to you now.",
  },

  currency: {
    label: "Currency",
    ariaLabel: "Show prices in",
    inAed: "in AED",
    approx: "approx.",
    /** Shown once beside the first converted figure on a page. */
    note: "Converted at {rate}, {date}. AED is the contract currency, the figure you sign is the dirham one.",
    unavailable: "Live rates are unavailable, so prices are shown in dirhams only.",
    peggedNote:
      "The dirham is pegged to the US dollar at a fixed 3.6725, so this rate does not move.",
    detected: "Prices are shown in {currency} because you appear to be visiting from {country}.",
    change: "Change",
  },

  language: {
    label: "Language",
    ariaLabel: "Choose a language",
    switcherHeading: "Read this site in",
    /** Shown at the top of an English page when the reader's browser asks for another language. */
    availableIn: "This page is also available in {language}.",
    notTranslatedTitle: "This page is published in English only.",
    notTranslatedBody:
      "Our guides carry Dubai's visa thresholds, fee schedules and tax rules. We publish those in English until a translation has been checked by someone qualified to check it, a mistranslated threshold is worse than no translation. Our advisor answers in your language and cites the same sources.",
    askAdvisor: "Ask in your language",
  },

  consent: {
    body: "We use cookies to measure which campaigns bring people here. Nothing loads until you choose.",
    accept: "Accept",
    decline: "Decline",
    readPolicy: "Privacy policy",
  },

  blocks: {
    faqEyebrow: "Questions",
    faqTitle: "Asked and answered",
    testimonialsEyebrow: "In their words",
    testimonialsTitle: "What clients say",
    developersEyebrow: "Developer partnerships",
  },

  trust: {
    heading: "Why a small brokerage can be trusted",
    credentials: [
      {
        label: "Licensed",
        value: `RERA ORN ${brand.reraOrn}`,
        detail: "Registered with Dubai's Real Estate Regulatory Agency.",
      },
      {
        label: "Based",
        value: `${brand.address.street}, ${brand.address.locality}`,
        detail: "A real office, in the district we transact in.",
      },
      {
        label: "Evidence",
        value: "Dubai Land Department data",
        detail: "We price from recorded transactions, and we cite them.",
      },
      {
        label: "Languages",
        value: "Five languages",
        detail: "Represented in the language you would rather negotiate in.",
      },
    ],
  },
} as const;

/**
 * Widens the literal types `as const` produced back to `string`.
 *
 * Without this the derived type would demand that the Arabic dictionary's
 * `nav.home` be the literal string "Home", technically a translation, not a
 * useful one. Tuples widen to arrays for the same reason: a headline that reads
 * well on two lines in English may want three in Russian.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

/**
 * The shape every other language must satisfy.
 *
 * Derived rather than hand-written, so adding an English key without
 * translating it fails the build in four places at once, the only reliable way
 * to stop a set of dictionaries drifting apart.
 */
export type Dictionary = Widen<typeof en>;
