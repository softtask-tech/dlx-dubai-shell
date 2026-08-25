/**
 * The advisor's server half: the model call, the conversation record and the
 * limits that keep one visitor from spending the month's budget.
 *
 * Everything here needs a credential or the service role, so none of it can be
 * reached from the browser except through the endpoint in
 * `src/routes/api/advisor/chat.ts`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { advisor } from "@/config/advisor";
import { adminDb } from "./database.server";
import type { AdvisorDatabase } from "./advisor-types";
import type { JsonObject } from "./types";
import { buildSystemPrompt, fallbackReply, type AdvisorChannel } from "./advisor-prompt.server";
import { retrieveContext, type RetrievedContext } from "./knowledge.server";
import type { AdvisorTurn } from "./advisor";

/* ------------------------------------------------------------ the model -- */

/**
 * Lovable AI is OpenAI-compatible, so the endpoint is a configuration value
 * rather than a code path. Pointing `ADVISOR_API_URL` at any compatible gateway
 * is a deployment change, not a rewrite, which matters because the model
 * behind an advisor with these guardrails will be revisited.
 */
const DEFAULT_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

function modelConfig() {
  return {
    endpoint: process.env["ADVISOR_API_URL"] ?? DEFAULT_ENDPOINT,
    key: process.env["LOVABLE_API_KEY"] ?? "",
    model: process.env["ADVISOR_MODEL"] ?? "google/gemini-2.5-flash",
  };
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class RateLimited extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("The advisor is rate limited");
    this.name = "RateLimited";
  }
}

/**
 * Streams a completion, yielding text as it arrives.
 *
 * One retry on a 429 and on a 5xx, because the alternative, telling a visitor
 * mid-question that the system is down, is worth one extra second of waiting.
 * A second failure is real and the caller falls back honestly rather than
 * spinning.
 */
export async function* streamCompletion(
  messages: ChatMessage[],
  options: { signal?: AbortSignal; maxTokens?: number } = {},
): AsyncGenerator<string> {
  const { endpoint, key, model } = modelConfig();
  if (!key) throw new Error("LOVABLE_API_KEY is not set");

  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        /* Low, not zero: the advisor should sound like a person, but this is
         * not the place for an inventive turn of phrase about a tax rule. */
        temperature: 0.3,
        max_tokens: options.maxTokens ?? 700,
      }),
      ...(options.signal ? { signal: options.signal } : {}),
    });

    if (response.ok) break;

    /* Upstream tells us how long to wait; believe it, within reason. */
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      if (attempt === 0) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000, 3000),
          ),
        );
        continue;
      }
      if (response.status === 429) {
        throw new RateLimited(Number.isFinite(retryAfter) ? Math.ceil(retryAfter) : 30);
      }
    }

    throw new Error(`The advisor's model responded ${response.status}`);
  }

  if (!response || !response.body) throw new Error("The advisor's model returned no stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        /* A partial frame from the gateway is normal; skip it. */
      }
    }
  }
}

/** One non-streamed completion, for summaries and extraction. */
export async function complete(
  messages: ChatMessage[],
  options: { maxTokens?: number } = {},
): Promise<string> {
  const { endpoint, key, model } = modelConfig();
  if (!key) throw new Error("LOVABLE_API_KEY is not set");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      max_tokens: options.maxTokens ?? 400,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "30");
    throw new RateLimited(Number.isFinite(retryAfter) ? Math.ceil(retryAfter) : 30);
  }
  if (!response.ok) throw new Error(`The advisor's model responded ${response.status}`);

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

export { fallbackReply };

/* ---------------------------------------------------- the conversation -- */

/** The service-role client, typed against the advisor tables. */
async function advisorDb(): Promise<SupabaseClient<AdvisorDatabase>> {
  return (await adminDb()) as unknown as SupabaseClient<AdvisorDatabase>;
}

export type Conversation = {
  id: string;
  session_token: string;
  channel: AdvisorChannel;
  language: string;
  transcript: AdvisorTurn[];
  qualification: JsonObject;
  turn_count: number;
  lead_id: string | null;
  summary: string | null;
};

/** Finds a conversation by its session token, or starts one. */
export async function openConversation(input: {
  sessionToken: string;
  channel: AdvisorChannel;
  language?: string;
  ipHash?: string;
  callSid?: string;
  callerNumber?: string;
}): Promise<Conversation> {
  const supabase = await advisorDb();

  const { data: existing, error: readError } = await supabase
    .from("advisor_conversations")
    .select("*")
    .eq("session_token", input.sessionToken)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (existing) return existing as unknown as Conversation;

  const { data, error } = await supabase
    .from("advisor_conversations")
    .insert({
      session_token: input.sessionToken,
      channel: input.channel,
      language: input.language ?? "en",
      ip_hash: input.ipHash ?? null,
      call_sid: input.callSid ?? null,
      caller_number: input.callerNumber ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Conversation;
}

/** Appends turns and advances the counters. */
export async function appendTurns(
  conversationId: string,
  existing: AdvisorTurn[],
  turns: AdvisorTurn[],
  patch: { language?: string; qualification?: JsonObject } = {},
): Promise<void> {
  const supabase = await advisorDb();
  const transcript = [...existing, ...turns];

  const { error } = await supabase
    .from("advisor_conversations")
    .update({
      transcript: transcript as unknown as never,
      turn_count: transcript.filter((turn) => turn.role === "user").length,
      last_turn_at: new Date().toISOString(),
      ...(patch.language ? { language: patch.language } : {}),
      ...(patch.qualification ? { qualification: patch.qualification as unknown as never } : {}),
    })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------- limits --- */

/**
 * A per-IP sliding window, in memory.
 *
 * Deliberately modest: this is not a defence against a determined attacker,
 * who would rotate addresses anyway. It stops the ordinary failure, a script,
 * a stuck retry loop, someone bored, from turning into a bill. The real cap is
 * the per-conversation turn limit, which is in the database and survives a
 * restart.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

export function checkIpRate(
  ipHash: string,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(ipHash) ?? []).filter((at) => now - at < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
  }

  recent.push(now);
  hits.set(ipHash, recent);

  /* Keep the map from growing without bound on a long-lived isolate. */
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((at) => now - at >= WINDOW_MS)) hits.delete(key);
    }
  }

  return { ok: true };
}

/** SHA-256 of the address, so logs and rows never hold the address itself. */
export async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function turnLimitReached(conversation: Conversation): boolean {
  return conversation.turn_count >= advisor.limitsPerSession.turns;
}

/* ------------------------------------------------------------ context --- */

export type QualifiedFacts = { intent?: string; timeline?: string; budget?: string; name?: string };

/**
 * Narrows the conversation's free-form qualification bag to the four facts the
 * prompt names.
 *
 * The column is jsonb and the extractor writes what it finds, so this is the
 * boundary where "whatever was stored" becomes "the fields the prompt promises
 * not to ask about twice". Anything else stored there stays for the admin to
 * read and never reaches the model as an instruction.
 */
export function qualifiedFrom(record: JsonObject | null | undefined): QualifiedFacts {
  const facts: QualifiedFacts = {};
  if (!record) return facts;

  for (const key of ["intent", "timeline", "budget", "name"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) facts[key] = value.trim();
  }
  return facts;
}

/** Retrieval plus the prompt, in the order both channels need them. */
export async function prepareTurn(input: {
  channel: AdvisorChannel;
  question: string;
  history: AdvisorTurn[];
  language?: string;
  qualified?: QualifiedFacts;
  pagePath?: string;
}): Promise<{ messages: ChatMessage[]; context: RetrievedContext }> {
  /* Retrieve against the question plus the last thing said, so "what about
   * there?" still lands on the community the visitor was just asking about. */
  const previousUser = [...input.history].reverse().find((turn) => turn.role === "user");
  const query = previousUser ? `${previousUser.content} ${input.question}` : input.question;

  const context = await retrieveContext(query);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt({
        channel: input.channel,
        context,
        ...(input.language ? { language: input.language } : {}),
        ...(input.qualified ? { qualified: input.qualified } : {}),
        ...(input.pagePath ? { pagePath: input.pagePath } : {}),
      }),
    },
    /* A window, not the whole history: the system prompt is long, and the last
     * few turns carry the thread perfectly well. */
    ...input.history.slice(-10).map<ChatMessage>((turn) => ({
      role: turn.role === "user" ? "user" : "assistant",
      content: turn.content,
    })),
    { role: "user", content: input.question },
  ];

  return { messages, context };
}
