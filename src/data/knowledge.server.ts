/**
 * Retrieval — server side only.
 *
 * The advisor answers from this and nothing else. `buildKnowledgeIndex()` reads
 * the database, so calling it on every conversational turn would put four
 * queries behind every sentence anyone types; this module builds it once, keeps
 * it warm, and hands the chat and the voice agent the handful of entries that
 * actually bear on the question.
 *
 * The important part is what comes back with the entries. `RetrievedContext`
 * carries the citations and the freshness dates alongside the prose, and the
 * flags that say whether this answer needs a verification line or a human. The
 * prompt builder cannot construct a well-formed instruction without them, which
 * is the point: the guardrails are not a paragraph of good intentions in a
 * system prompt, they are a shape the code has to fill in.
 */
import {
  buildKnowledgeIndex,
  searchKnowledge,
  type KnowledgeEntry,
  type KnowledgeIndex,
} from "./knowledge";

/**
 * An in-memory cache of the assembled index.
 *
 * Fifteen minutes: listings and market figures change on the order of days, and
 * a conversation that starts on a slightly stale index is a far better outcome
 * than one that waits on four queries per turn. Module scope survives between
 * invocations while the isolate is warm.
 */
let cache: { index: KnowledgeIndex; expiresAt: number } | null = null;

const CACHE_MS = 15 * 60 * 1000;

/** In-flight rebuild, so a burst of turns produces one build rather than ten. */
let inFlight: Promise<KnowledgeIndex> | null = null;

export async function knowledgeIndex(): Promise<KnowledgeIndex> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.index;
  if (inFlight) return inFlight;

  inFlight = buildKnowledgeIndex()
    .then((index) => {
      cache = { index, expiresAt: Date.now() + CACHE_MS };
      return index;
    })
    .catch((error: unknown) => {
      console.error("[advisor] could not rebuild the knowledge index", error);
      /* A stale index beats no index: the guides and the fee schedule are still
       * true, and the alternative is an advisor with nothing to say. */
      if (cache) return cache.index;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export type Citation = {
  /** The line the advisor must repeat when it uses this entry's figures. */
  label: string;
  /** Where the visitor can read it themselves. */
  url: string;
  title: string;
  /** ISO date, for the freshness stamp. */
  updatedAt?: string;
};

export type RetrievedContext = {
  entries: KnowledgeEntry[];
  citations: Citation[];
  /** True when anything retrieved needs the "verify with the authority" line. */
  requiresVerification: boolean;
  /** True when anything retrieved should end with a consultant, not an answer. */
  routeToHuman: boolean;
  /** True when nothing matched — the advisor must say so rather than improvise. */
  isEmpty: boolean;
};

/**
 * The entries that bear on one question.
 *
 * Retrieval is deliberately generous with the guide and tool material and
 * careful with listings: a question about Palm Jumeirah should reach the market
 * figures and the community guide before it reaches three apartments, because
 * the first two answer it and the third is a sales pitch.
 */
export async function retrieveContext(
  question: string,
  options: { limit?: number } = {},
): Promise<RetrievedContext> {
  const limit = options.limit ?? 6;
  const index = await knowledgeIndex();

  const explanatory = index.entries.filter((entry) => entry.kind !== "listing");
  const listings = index.entries.filter((entry) => entry.kind === "listing");

  const entries = [
    ...searchKnowledge(explanatory, question, limit - 2),
    ...searchKnowledge(listings, question, 2),
  ];

  return {
    entries,
    citations: entries.filter((entry) => entry.source).map(citationFor),
    requiresVerification: entries.some((entry) => entry.requiresVerification),
    routeToHuman: entries.some((entry) => entry.routeToHuman),
    isEmpty: entries.length === 0,
  };
}

function citationFor(entry: KnowledgeEntry): Citation {
  return {
    label: entry.source ?? "",
    url: entry.url,
    title: entry.title,
    ...(entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
  };
}

/** Clears the cache. Used by the admin after a data import or a publish. */
export function invalidateKnowledgeCache(): void {
  cache = null;
}
