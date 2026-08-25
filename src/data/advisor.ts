/**
 * Shapes the advisor's two channels and its client share.
 *
 * Client-safe: no database, no keys, no prompt. The chat panel imports this for
 * the wire format, the server imports it to produce that format, and the voice
 * layer stores its turns in the same shape so the admin renders a phone call
 * and a chat with one component.
 */

export type AdvisorRole = "user" | "advisor";

export type AdvisorCitation = {
  /** The attribution line, e.g. "Source: Dubai Land Department". */
  label: string;
  title: string;
  url: string;
  /** ISO date, for the freshness stamp beside the answer. */
  updatedAt?: string;
};

export type AdvisorTurn = {
  role: AdvisorRole;
  content: string;
  /** ISO timestamp. */
  at: string;
  /** Present on advisor turns that used cited material. */
  citations?: AdvisorCitation[];
};

/**
 * The streaming wire format: newline-delimited JSON.
 *
 * Chosen over raw SSE because the answer is not the only thing travelling, the
 * citations and the verification flag arrive with it, and they have to be
 * attached to the right turn rather than guessed at from the prose.
 */
export type AdvisorEvent =
  | {
      type: "meta";
      conversationId: string;
      sessionToken: string;
      citations: AdvisorCitation[];
      requiresVerification: boolean;
    }
  | { type: "delta"; text: string }
  | { type: "done"; turnCount: number; leadCaptured?: boolean }
  /** `fallback` is copy for the visitor; `message` is for the console. */
  | { type: "error"; message: string; fallback: string; retryAfterSeconds?: number };

/** Parses a chunked NDJSON stream into events, tolerating split lines. */
export function createEventParser(): (chunk: string) => AdvisorEvent[] {
  let buffer = "";

  return (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    /* The last element is either "" or a partial line; keep it for next time. */
    buffer = lines.pop() ?? "";

    const events: AdvisorEvent[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed) as AdvisorEvent);
      } catch {
        /* A malformed frame is not worth killing the conversation over. */
        console.warn("[advisor] dropped an unparseable frame");
      }
    }
    return events;
  };
}

/** A random session token. Long enough that guessing one is not a strategy. */
export function newSessionToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * A cheap language guess from the visitor's own text.
 *
 * Script detection only: it tells Arabic from Latin from Devanagari, which is
 * what the prompt needs to say "they wrote to you in Arabic". Distinguishing
 * French from German is the model's job, not a regex's.
 */
export function guessLanguage(text: string): string | undefined {
  if (/[؀-ۿ]/.test(text)) return "ar";
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[a-zA-Z]/.test(text)) return "en";
  return undefined;
}
