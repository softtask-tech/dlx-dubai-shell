/**
 * The advisor's identity.
 *
 * Import-free, like `brand.ts`, so the browser bundle, the server and any build
 * script read the same facts.
 *
 * ON THE NAME. CLAUDE.md asks for an advisor with presence and a name rather
 * than an anonymous corner bubble, and a name does a real job: it gives the
 * voice agent something to answer to and gives the chat a personality restrained
 * enough to sit inside this brand. But a human name on a machine is a lie
 * waiting to be believed, someone tells "Noor" about their divorce settlement
 * because they think a person is reading. So the name never appears without the
 * role beside it, in the header, in the greeting and in the first thing the
 * voice agent says. Named, and never pretending.
 */
export const advisor = {
  name: "Noor",
  /** Always rendered next to the name. Never omitted to save space. */
  role: "DLX AI advisor",
  /** The one-line disclosure, used wherever the advisor introduces itself. */
  disclosure: "I'm an AI advisor for DLX Properties, not a person.",

  /** What the advisor opens with. Deliberately a question, not a pitch. */
  greeting:
    "I can help with Dubai property, investment returns, the Golden Visa routes and relocating here. What are you trying to work out?",

  /** Spoken first line. Shorter, nobody wants a paragraph on a phone call. */
  voiceGreeting:
    "Hello, this is Noor, the AI advisor for DLX Properties. I can help with Dubai property, investment, the Golden Visa or relocating. What can I help you with?",

  /** Openers offered as chips, so the first message is never a blank page. */
  prompts: [
    "What does rental yield actually mean?",
    "What will a purchase cost me in total?",
    "Which communities give the best returns?",
    "How do the Golden Visa property routes work?",
  ],

  /**
   * What the advisor will not do, in the visitor's words rather than the
   * policy's. Shown in the panel so expectations are set before the first
   * question rather than after a disappointing answer.
   */
  limits: [
    "Quotes figures only from our Dubai Land Department data and our published fee schedule.",
    "Will not guess at visa, tax or legal specifics. Those go to a licensed adviser.",
    "Hands you to a named consultant the moment a question turns on your circumstances.",
  ],

  /**
   * Languages offered explicitly in the UI. The advisor answers in whatever
   * language it is written to; this list is the set worth naming, drawn from
   * the five audiences the brand is built for.
   */
  languages: [
    { code: "en", label: "English", dir: "ltr" },
    { code: "ar", label: "العربية", dir: "rtl" },
    { code: "ru", label: "Русский", dir: "ltr" },
    { code: "fr", label: "Français", dir: "ltr" },
    { code: "hi", label: "हिन्दी", dir: "ltr" },
    { code: "ur", label: "اردو", dir: "rtl" },
    { code: "zh", label: "中文", dir: "ltr" },
  ],

  /** Caps, shared by the UI (which warns) and the endpoint (which enforces). */
  limitsPerSession: {
    turns: 30,
    /** Characters accepted in one message. */
    messageChars: 2000,
  },
} as const;

export type AdvisorLanguage = (typeof advisor.languages)[number]["code"];

export function languageLabel(code: string): string {
  return advisor.languages.find((entry) => entry.code === code)?.label ?? code.toUpperCase();
}

export function isRtl(code: string): boolean {
  return advisor.languages.find((entry) => entry.code === code)?.dir === "rtl";
}
