/**
 * The advisor's knowledge source.
 *
 * CLAUDE.md gives the chat and the voice agent one brain, and names what it may
 * speak from: the DLD market database, the playbook guides, the listings and
 * the services. This module assembles exactly that into one typed index, so
 * Phase 5 retrieves from a single shape rather than reaching into six modules
 * and inventing its own rules on the way.
 *
 * Three things make this more than a content dump.
 *
 * **Every entry carries its own guardrails.** `requiresVerification` marks the
 * material where the advisor must say the figures need confirming with the
 * authority, and `routeToHuman` marks the questions it must hand to a named
 * consultant rather than answer. Those flags come from the content itself — a
 * guide that already renders the dated verification note sets the same flag
 * here — so the site and the advisor cannot drift into disagreeing.
 *
 * **Every entry carries its provenance.** Market entries take their attribution
 * from `attributionFor()`, which derives it from the `data_provenance` column.
 * When the rows are DLD records the entry says so and the advisor may cite the
 * Dubai Land Department; when they are sample rows it says *that*, and the
 * advisor must not. No entry lets the advisor cite a source the data does not
 * have.
 *
 * **Nothing here is generated prose.** Every answer is copy a human wrote and
 * a reader can see on the site. If the advisor quotes an entry, the visitor can
 * follow `url` and find the same words.
 */
import { attributionFor, listAreasWithStats } from "./market";
import {
  BLOG_CATEGORY_LABELS,
  listPosts,
  readingMinutesFor,
  type BlogPostWithAuthor,
} from "./blog";
import { GUIDES, GUIDE_CATEGORY_LABELS } from "./guides";
import { SERVICES } from "./services";
import { TOOLS } from "./tools";
import { FEE_SCHEDULE_VERIFIED_ON } from "./fee-schedule";
import type { AreaStats, AreaWithStats } from "./market-types";
import type { BlogPost } from "./types";

export type KnowledgeKind = "guide" | "tool" | "service" | "post" | "market";

export type KnowledgeEntry = {
  /** Stable and readable: "guide:golden-visa-guide". */
  id: string;
  kind: KnowledgeKind;
  title: string;
  /** The questions this entry answers, in a visitor's words. */
  questions: string[];
  /** The short, quotable answer — one paragraph, plain language. */
  answer: string;
  /** Supporting prose, in reading order. */
  body: string[];
  /** Where the advisor should send the visitor to read it themselves. */
  url: string;
  /** Attribution the advisor must repeat when it uses this entry's figures. */
  source?: string;
  /** ISO date this content was reviewed, or the data last recomputed. */
  updatedAt?: string;
  /** The advisor must add the "verify with the authority" line. */
  requiresVerification: boolean;
  /** The advisor must hand this to a named consultant rather than answer it. */
  routeToHuman: boolean;
  tags: string[];
};

export type KnowledgeIndex = {
  /** When this snapshot was assembled. */
  generatedAt: string;
  policy: typeof ADVISOR_POLICY;
  counts: Record<KnowledgeKind, number>;
  entries: KnowledgeEntry[];
};

/**
 * The rules the advisor operates under, shipped with the knowledge rather than
 * written into a prompt somewhere else.
 *
 * A prompt in one repository and a policy in another is how a chat agent and a
 * voice agent end up saying different things. These travel with the entries.
 */
export const ADVISOR_POLICY = {
  scope: [
    "Dubai and UAE real estate: buying, selling, renting, owning.",
    "Property investment: yields, costs, communities, off-plan and ready.",
    "The Golden Visa property routes, in principle.",
    "Relocating to Dubai: sequence, communities, cost of living.",
    "DLX Properties itself: services, people, how we work.",
  ],
  decline:
    "Anything outside Dubai and UAE property, investment, the Golden Visa and relocation. Decline politely, say what you can help with, and offer a consultant.",
  never: [
    "Never state a price, a yield or an availability that is not in this index.",
    "Never state a legal, visa or tax rule as settled fact. Explain how it works and what it depends on, then route to a licensed adviser.",
    "Never assert Golden Visa eligibility. Indicate where a value sits and hand the determination to an immigration adviser.",
    "Never imply that DLX is affiliated with, endorsed by or acting for the Dubai Land Department.",
    "Never fill a gap by guessing. If the index does not answer it, say so and offer a consultant.",
  ],
  citation: {
    rule: "Quote an entry's `source` verbatim whenever you use its figures, together with its `updatedAt` date.",
    officialLabel: "Source: Dubai Land Department",
    note: "An entry whose source is not the official label is illustrative. Say so in the same breath as the number, and never call it a DLD figure.",
  },
  verification: {
    rule: "When an entry has `requiresVerification`, say plainly that the figures change and must be confirmed with the relevant UAE authority before the visitor relies on them.",
    feesVerifiedOn: FEE_SCHEDULE_VERIFIED_ON,
  },
  handoff: {
    rule: "When an entry has `routeToHuman`, or when the visitor asks about their own circumstances, offer a named consultant and capture the enquiry.",
    capture:
      "Every conversation that reaches a specific question should end as a lead: name, a way to reply, and what they are trying to work out.",
  },
} as const;

/**
 * The entries that need no database: guides, tools and services.
 *
 * Kept synchronous on purpose — it is the part of the index that is always
 * available, so the advisor still has the playbook and the fee schedule behind
 * it when Supabase is unreachable.
 */
export function staticKnowledge(): KnowledgeEntry[] {
  const guides = GUIDES.map<KnowledgeEntry>((guide) => ({
    id: `guide:${guide.slug}`,
    kind: "guide",
    title: guide.title,
    questions: [guide.title, ...guide.faqs.map((faq) => faq.question)],
    answer: guide.answer,
    body: [
      ...guide.sections.flatMap((section) => [
        section.heading,
        ...section.body,
        ...(section.points ?? []),
      ]),
      ...guide.faqs.map((faq) => `${faq.question} ${faq.answer}`),
    ],
    url: `/guides/${guide.slug}`,
    updatedAt: guide.reviewedOn,
    requiresVerification: guide.verifyWithAuthorities,
    /* A guide that needs verifying is a guide whose specifics belong to an
     * adviser, not to a chat window. */
    routeToHuman: guide.verifyWithAuthorities,
    tags: [GUIDE_CATEGORY_LABELS[guide.category]],
  }));

  const tools = TOOLS.map<KnowledgeEntry>((tool) => ({
    id: `tool:${tool.slug}`,
    kind: "tool",
    title: tool.title,
    questions: [tool.question, ...tool.faqs.map((faq) => faq.question)],
    answer: tool.answer,
    body: [tool.description, ...tool.faqs.map((faq) => `${faq.question} ${faq.answer}`)],
    url: `/tools/${tool.slug}`,
    /* Only the tools that quote the fee schedule carry its verification date;
     * a date on a tool that quotes nothing dated would be noise. */
    ...(tool.needsVerificationNote ? { updatedAt: FEE_SCHEDULE_VERIFIED_ON } : {}),
    requiresVerification: tool.needsVerificationNote,
    routeToHuman: tool.slug === "golden-visa-eligibility",
    tags: [tool.category, ...(tool.usesMarketData ? ["DLD data"] : [])],
  }));

  const services = SERVICES.map<KnowledgeEntry>((service) => ({
    id: `service:${service.slug}`,
    kind: "service",
    title: service.title,
    questions: [
      `What does DLX do about ${service.name.toLowerCase()}?`,
      ...service.faqs.map((faq) => faq.question),
    ],
    answer: service.tagline,
    body: [
      ...service.body,
      `Who this is for: ${service.audience}`,
      ...service.deliverables,
      ...service.faqs.map((faq) => `${faq.question} ${faq.answer}`),
    ],
    url: `/services/${service.slug}`,
    requiresVerification: false,
    /* A service enquiry is the moment a consultant should take over. */
    routeToHuman: true,
    tags: [service.name],
  }));

  return [...guides, ...tools, ...services];
}

/**
 * The whole index, including the parts that need the database.
 *
 * The database-backed sources degrade the way every other public read does: a
 * market table that is unreachable costs the advisor its figures, not its
 * ability to answer.
 */
export async function buildKnowledgeIndex(): Promise<KnowledgeIndex> {
  const [areas, posts] = await Promise.all([
    /* Typed fallbacks: an untyped `[]` widens the result to a union and the
     * narrowing filter below stops narrowing. */
    listAreasWithStats().catch(() => [] as AreaWithStats[]),
    listPosts().catch(() => [] as BlogPostWithAuthor[]),
  ]);

  const market = areas
    .filter((area): area is AreaWithStats & { stats: AreaStats } => area.stats !== null)
    .map(marketEntry);

  const journal = posts.map(postEntry);

  const entries = [...staticKnowledge(), ...market, ...journal];

  const counts: Record<KnowledgeKind, number> = {
    guide: 0,
    tool: 0,
    service: 0,
    post: 0,
    market: 0,
  };
  for (const entry of entries) counts[entry.kind] += 1;

  return { generatedAt: new Date().toISOString(), policy: ADVISOR_POLICY, counts, entries };
}

/**
 * One community's recorded figures.
 *
 * The attribution comes from `attributionFor()`, which reads the provenance
 * column — so the entry can only say "Source: Dubai Land Department" when the
 * rows behind it genuinely are DLD records, and says plainly that they are
 * illustrative when they are not. The advisor repeats whatever it finds here.
 */
export function marketEntry(area: AreaWithStats & { stats: AreaStats }): KnowledgeEntry {
  const stats = area.stats;
  const attribution = attributionFor(stats.provenance, stats.last_updated);
  const figures: string[] = [];

  if (stats.median_price_per_sqft !== null) {
    figures.push(
      `Median price per square foot: AED ${Math.round(stats.median_price_per_sqft).toLocaleString("en-AE")}.`,
    );
  }
  if (stats.gross_yield_pct !== null) {
    figures.push(`Gross rental yield: ${stats.gross_yield_pct.toFixed(1)}% (gross, before costs).`);
  }
  if (stats.yoy_price_change_pct !== null) {
    figures.push(`Year on year price change: ${stats.yoy_price_change_pct.toFixed(1)}%.`);
  }
  figures.push(
    `Recorded transactions in the window ${stats.window_start} to ${stats.window_end}: ${stats.transaction_count}.`,
  );

  return {
    id: `market:${area.slug}`,
    kind: "market",
    title: `${area.name} market figures`,
    questions: [
      `What are prices like in ${area.name}?`,
      `What yield does ${area.name} give?`,
      `Is ${area.name} a good place to buy?`,
    ],
    answer:
      area.summary ??
      `Recorded transaction figures for ${area.name}, computed over a rolling twelve months.`,
    body: figures,
    url: `/areas/${area.slug}`,
    source: attribution.label,
    updatedAt: stats.last_updated,
    requiresVerification: false,
    routeToHuman: false,
    tags: ["market", area.name],
  };
}

/** One journal post, with the Markdown syntax stripped back to prose. */
export function postEntry(post: BlogPost): KnowledgeEntry {
  return {
    id: `post:${post.slug}`,
    kind: "post",
    title: post.title,
    questions: [post.title],
    answer: post.excerpt ?? post.title,
    body: plainText(post.body ?? ""),
    url: `/blog/${post.slug}`,
    updatedAt: post.published_at ?? post.updated_at,
    requiresVerification: false,
    routeToHuman: false,
    tags: [BLOG_CATEGORY_LABELS[post.category], `${readingMinutesFor(post)} min read`],
  };
}

/** Strips the Markdown subset the journal uses, leaving paragraphs of prose. */
function plainText(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[->]\s+/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Lexical retrieval over the index.
 *
 * Deliberately simple: term overlap, weighted towards the questions and the
 * title, because those are the visitor's own words. It is not semantic search
 * and does not pretend to be — with a few hundred entries of hand-written copy
 * it is enough to put the right three in front of the model, and a Phase 5
 * embedding index can replace it behind this same signature.
 */
export function searchKnowledge(
  entries: readonly KnowledgeEntry[],
  query: string,
  limit = 5,
): KnowledgeEntry[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.entry);
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "should",
  "than",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreEntry(entry: KnowledgeEntry, terms: readonly string[]): number {
  const title = tokenize(entry.title);
  const questions = entry.questions.flatMap(tokenize);
  const answer = tokenize(entry.answer);
  const body = tokenize([...entry.body, ...entry.tags].join(" "));

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 5;
    if (questions.includes(term)) score += 4;
    if (answer.includes(term)) score += 2;
    if (body.includes(term)) score += 1;
  }
  return score;
}
