import { advisor } from "@/config/advisor";
import type { AdvisorTurn } from "./advisor";

/**
 * What to suggest asking, given where the reader is and what they just heard.
 *
 * The panel opened on the same four questions everywhere, which is a menu
 * rather than a suggestion. Someone standing on a community page has a
 * different question from someone on the off-plan index, and someone who has
 * just been told a yield has an obvious next question that the panel was not
 * offering.
 *
 * Deliberately derived rather than generated. A model call to decide what to
 * suggest would cost a round trip before the first word, and would sometimes
 * suggest a question the advisor is not allowed to answer. These come from the
 * path and from what was actually said, so they are instant, free, and always
 * inside scope.
 */
const BY_SECTION: { match: RegExp; prompts: readonly string[] }[] = [
  {
    match: /^\/market-intelligence\/communities\//,
    prompts: [
      "What does a home here actually cost?",
      "What does it rent for, and what is left after the service charge?",
      "How does this community compare with the rest of Dubai?",
      "Is this a good place to buy right now?",
    ],
  },
  {
    match: /^\/market-intelligence/,
    prompts: [
      "Which communities give the best yield after the service charge?",
      "Are Dubai prices still rising?",
      "Is off-plan more expensive than a home I could move into?",
      "What is the median price per square foot in Dubai?",
    ],
  },
  {
    match: /^\/(off-plan|projects)/,
    prompts: [
      "What is the payment plan on this project?",
      "What should I check before committing to off-plan?",
      "How does this price compare with ready property nearby?",
      "When is handover, and what happens if it slips?",
    ],
  },
  {
    match: /^\/(areas|properties)/,
    prompts: [
      "Which Dubai community suits a family?",
      "Where do the highest rental yields sit?",
      "What does it cost to buy, on top of the price?",
      "Can I get a Golden Visa with a property purchase?",
    ],
  },
  {
    match: /^\/(guides|blog)/,
    prompts: [
      "What are the total costs of buying in Dubai?",
      "Can I get a Golden Visa through property?",
      "How does the service charge work?",
      "Can a foreigner buy freehold in Dubai?",
    ],
  },
  {
    match: /^\/(tools|services|contact|about|team)/,
    prompts: [
      "What would DLX actually do for me?",
      "What does it cost to buy, on top of the price?",
      "Which communities should I be looking at?",
      "Can I speak to a person?",
    ],
  },
];

/** The questions to offer before anything has been asked. */
export function openingSuggestions(pagePath: string): readonly string[] {
  const section = BY_SECTION.find((entry) => entry.match.test(pagePath));
  return section ? section.prompts : advisor.prompts;
}

/**
 * Where a reader usually wants to go next, read from the answer they just got.
 *
 * Matched on what the advisor said rather than on what was asked, because the
 * answer is what raises the next question: a figure invites "compared with
 * what", a mention of the service charge invites "how much", and a hand-off to
 * a consultant invites the only question that matters after that.
 */
const FOLLOW_UPS: { match: RegExp; prompts: readonly string[] }[] = [
  {
    match: /service charge/i,
    prompts: [
      "How much is the service charge there?",
      "What is the yield once the service charge comes off?",
    ],
  },
  {
    match: /yield|rent/i,
    prompts: [
      "Which community gives a better return than that?",
      "What does a tenant actually pay there?",
    ],
  },
  {
    match: /off-plan|handover|payment plan/i,
    prompts: [
      "How does that compare with a home I could move into today?",
      "What should I check before I commit?",
    ],
  },
  {
    match: /per square foot|median|price/i,
    prompts: [
      "How has that changed over the last year?",
      "Is that expensive for Dubai?",
    ],
  },
  {
    match: /consultant|speak to|call/i,
    prompts: ["Can someone call me back today?", "What will they need to know from me?"],
  },
];

const ALWAYS = [
  "What are the total costs of buying?",
  "Can I get a Golden Visa through property?",
  "Can someone call me back?",
];

export function followUpSuggestions(turns: readonly AdvisorTurn[], limit = 3): readonly string[] {
  const lastAnswer = [...turns].reverse().find((turn) => turn.role === "advisor")?.content ?? "";
  if (!lastAnswer) return [];

  /* Never suggest something already asked. Offering a question back to
   * somebody who just asked it reads as not having listened. */
  const asked = new Set(
    turns.filter((turn) => turn.role === "user").map((turn) => turn.content.trim().toLowerCase()),
  );

  const matched = FOLLOW_UPS.filter((entry) => entry.match.test(lastAnswer)).flatMap(
    (entry) => entry.prompts,
  );

  const seen = new Set<string>();
  return [...matched, ...ALWAYS]
    .filter((prompt) => {
      const key = prompt.trim().toLowerCase();
      if (asked.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
