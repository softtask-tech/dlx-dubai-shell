/**
 * advisor-call-summary, the end of a phone call.
 *
 * The telephony layer posts here when a call finishes: the transcript, its own
 * summary if it made one, how long the call ran, and whatever contact details
 * the caller gave. This function stores the call against its conversation and
 * asks the site to turn it into a lead.
 *
 * WHY IT DOES NOT SCORE THE LEAD ITSELF. Lead scoring lives in
 * `src/data/lead-scoring.ts` and is the same for a form, a calculator, the chat
 * and a phone call. That is the whole point of it. Copying those rules into
 * Deno would give us two sets that agree today and disagree the first time
 * someone tunes one. So this function does what only it can do (receive the
 * webhook, hold the transcript) and hands the lead to `/api/advisor/call-lead`,
 * which scores it exactly as every other channel is scored.
 *
 * The two steps fail independently. If the site is unreachable the transcript
 * is still stored and the response says the lead was not written, so a retry
 * from the provider, or a person in the admin - can finish the job.
 *
 * Environment:
 *   VOICE_WEBHOOK_SECRET, shared with the telephony layer and with the site
 *   SITE_URL, origin of the deployed site, for the lead hand-off
 * Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-advisor-secret",
};

type Turn = { role: "user" | "advisor"; content: string; at?: string };

type Payload = {
  callSid?: string;
  callerNumber?: string;
  durationSeconds?: number;
  language?: string;
  summary?: string;
  transcript?: Turn[];
  /** Whatever the caller gave, if the telephony layer captured it. */
  contact?: { name?: string; email?: string; phone?: string };
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

/** Keeps a malformed transcript from poisoning the row. */
function cleanTranscript(input: unknown): Turn[] {
  if (!Array.isArray(input)) return [];
  const turns: Turn[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const role = record.role === "advisor" ? "advisor" : record.role === "user" ? "user" : null;
    const content = typeof record.content === "string" ? record.content.trim() : "";
    if (!role || content.length === 0) continue;

    turns.push({
      role,
      content: content.slice(0, 4000),
      at: typeof record.at === "string" ? record.at : new Date().toISOString(),
    });
  }

  return turns.slice(0, 400);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("VOICE_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[call-summary] VOICE_WEBHOOK_SECRET is not set; refusing every call");
    return json({ error: "Not configured" }, 503);
  }
  if (request.headers.get("x-advisor-secret") !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const callSid = payload.callSid?.trim();
  if (!callSid) return json({ error: "callSid is required" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  /* The turn endpoint has usually created this row already, one turn at a
   * time. When the call never reached the advisor, straight to voicemail, a
   * provider-side transcript. This is the first we hear of it. */
  const { data: existing } = await supabase
    .from("advisor_conversations")
    .select("id, transcript, lead_id")
    .eq("call_sid", callSid)
    .maybeSingle();

  const posted = cleanTranscript(payload.transcript);
  /* Prefer the transcript we built turn by turn; it has our own timestamps and
   * we know it is what the advisor actually said. */
  const transcript =
    Array.isArray(existing?.transcript) && existing.transcript.length >= posted.length
      ? (existing.transcript as Turn[])
      : posted;

  const row = {
    channel: "voice" as const,
    session_token: `call:${callSid}`,
    call_sid: callSid,
    caller_number: payload.callerNumber ?? null,
    call_seconds:
      typeof payload.durationSeconds === "number" ? Math.round(payload.durationSeconds) : null,
    language: payload.language ?? "en",
    transcript,
    summary: payload.summary?.trim()?.slice(0, 4000) ?? null,
    ended_at: new Date().toISOString(),
  };

  const { data: conversation, error } = existing
    ? await supabase
        .from("advisor_conversations")
        .update(row)
        .eq("id", existing.id)
        .select("id, lead_id")
        .single()
    : await supabase.from("advisor_conversations").insert(row).select("id, lead_id").single();

  if (error) {
    console.error("[call-summary] could not store the call", error);
    return json({ error: "Could not store the call" }, 500);
  }

  /* Hand the lead to the site, which owns scoring. */
  let leadId: string | null = conversation.lead_id ?? null;
  let leadError: string | null = null;

  if (!leadId) {
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) {
      leadError = "SITE_URL is not set";
    } else {
      try {
        const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/advisor/call-lead`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-advisor-secret": secret },
          body: JSON.stringify({
            conversationId: conversation.id,
            callSid,
            callerNumber: payload.callerNumber ?? null,
            contact: payload.contact ?? {},
            summary: row.summary,
            transcript,
          }),
          signal: AbortSignal.timeout(20_000),
        });

        if (response.ok) {
          const result = (await response.json()) as { leadId?: string };
          leadId = result.leadId ?? null;
        } else {
          leadError = `site responded ${response.status}`;
        }
      } catch (error) {
        leadError = error instanceof Error ? error.message : "unknown";
      }
    }

    /* Never fatal. The call is on record either way, and the admin surfaces a
     * conversation with no lead attached. */
    if (leadError) console.error("[call-summary] lead hand-off failed:", leadError);
  }

  return json({
    ok: true,
    conversationId: conversation.id,
    turns: transcript.length,
    leadId,
    ...(leadError ? { leadError } : {}),
  });
});
