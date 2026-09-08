import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { captureLead } from "@/data/advisor-capture.server";

/**
 * POST /api/advisor/fish-webhook, a finished Fish Audio agent call.
 *
 * Fish runs the conversation itself, so unlike `/api/advisor/call-lead` there
 * is no transcript to reason over here and nothing to extract: the agent has
 * already pulled the fields out under `analysis.data`, against the schema the
 * provisioning script sets. This route's whole job is to believe it only when
 * the signature says it may, and to write a lead once.
 *
 * WHY THE SIGNATURE IS NOT OPTIONAL. This endpoint creates records from an
 * unauthenticated request. Fish signs with HMAC-SHA256 over `{timestamp}.{raw
 * body}` and sends `t=` and `v1=` in one header. Without checking it, anyone
 * who learns the URL can post fabricated leads into the pipeline, and the
 * admin emails would carry them. So a missing secret refuses every request
 * rather than degrading to open.
 *
 * DELIVERY IS AT LEAST ONCE. The same call arrives more than once in normal
 * operation, so the session id is the idempotency key: `captureLead` is keyed
 * on the conversation, and a repeat updates rather than duplicating.
 *
 * Transcripts are deliberately absent from Fish's payloads. When a consultant
 * needs one it is fetched from the sessions API against the id recorded here.
 */
const fieldSchema = z.object({
  name: z.string().max(64),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

const bodySchema = z.object({
  event: z.string().max(64),
  session: z.object({
    id: z.string().min(3).max(128),
    agent_id: z.string().max(128).optional(),
    caller_number: z.string().max(40).nullish(),
    end_user_id: z.string().max(128).nullish(),
    duration_seconds: z.number().nonnegative().optional(),
    conversation_started_at: z.string().max(64).optional(),
  }),
  analysis: z
    .object({
      summary: z.string().max(4000).nullish(),
      data: z.array(fieldSchema).max(40).default([]),
      finished_at: z.string().max(64).nullish(),
    })
    .nullish(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Constant-time compare, so a wrong signature cannot be found a byte at a time. */
function sameSignature(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signatureValid(header: string, raw: string, secret: string): Promise<boolean> {
  /* "t=1784808000,v1=8693a4b9…" */
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, ...rest] = piece.trim().split("=");
      return [key ?? "", rest.join("=")];
    }),
  );
  const timestamp = Number(parts["t"]);
  const provided = parts["v1"];
  if (!Number.isFinite(timestamp) || !provided) return false;

  /* Five minutes. Without this a signature captured once is valid forever. */
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${raw}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sameSignature(expected, provided.toLowerCase());
}

/**
 * The agent's extracted fields, mapped onto the shape the lead pipeline takes.
 *
 * `Extraction` accepts exactly name, email, phone, intent, timeline,
 * budgetMinAed, budgetMaxAed and summary, and its intent and timeline are
 * closed vocabularies the rest of the site already uses. The agent is
 * configured with those same vocabularies by `scripts/fish-agent.mjs`, so this
 * is a mapping rather than a translation, and anything outside them is dropped
 * instead of being coerced into a value a consultant would then act on.
 *
 * The communities a caller named have no field of their own, so they are
 * folded into the summary, which is the line a consultant reads before calling
 * back and the right place for "they asked about Marina and JVC".
 */
const INTENTS = new Set(["buy", "sell", "rent", "invest", "relocate", "advice"]);
const TIMELINES = new Set(["immediately", "within_3_months", "within_12_months", "researching"]);

function contactFrom(fields: readonly z.infer<typeof fieldSchema>[], summary?: string | null) {
  const read = (name: string) => {
    const found = fields.find((field) => field.name === name);
    const value = found?.value;
    return value === null || value === undefined || value === "" ? undefined : String(value);
  };

  const intent = read("intent");
  const timeline = read("timeline");
  /* A spoken budget arrives as the caller said it. Only a clean number is
   * used; "around two and a half" is left for the consultant to read in the
   * summary rather than turned into a figure nobody actually stated. */
  const budgetRaw = read("budget_aed")?.replace(/[^\d]/g, "") ?? "";
  const budget = budgetRaw.length >= 5 ? Number(budgetRaw) : undefined;

  const communities = read("communities");
  const note = [summary?.trim(), communities ? `Asked about: ${communities}.` : null]
    .filter(Boolean)
    .join(" ");

  return {
    ...(read("caller_name") ? { name: read("caller_name") } : {}),
    ...(read("callback_number") ? { phone: read("callback_number") } : {}),
    ...(intent && INTENTS.has(intent) ? { intent } : {}),
    ...(timeline && TIMELINES.has(timeline) ? { timeline } : {}),
    ...(budget !== undefined && Number.isFinite(budget) ? { budgetMinAed: budget } : {}),
    ...(note ? { summary: note.slice(0, 4000) } : {}),
  };
}

export const Route = createFileRoute("/api/advisor/fish-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["FISH_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[advisor:fish] FISH_WEBHOOK_SECRET is not set; refusing every call");
          return json({ error: "Not configured" }, 503);
        }

        const header = request.headers.get("x-fish-webhook-signature");
        const raw = await request.text();
        if (!header || !(await signatureValid(header, raw, secret))) {
          return json({ error: "Unauthorized" }, 401);
        }

        let input: z.infer<typeof bodySchema>;
        try {
          input = bodySchema.parse(JSON.parse(raw));
        } catch {
          return json({ error: "Bad request" }, 400);
        }

        /* Only the analysed event carries the fields. `call.ended` arrives
         * first and has nothing to write yet, so it is acknowledged and
         * dropped rather than producing a lead with nothing in it. */
        if (input.event !== "call.analyzed" || !input.analysis) {
          return json({ ok: true, ignored: input.event });
        }

        const contact = contactFrom(input.analysis.data, input.analysis.summary);

        /* The number they called from beats anything the agent heard. */
        const phone = contact.phone ?? input.session.caller_number ?? undefined;
        if (!phone) {
          return json({ leadId: null, reason: "no contact details" });
        }

        try {
          /* The session id is Fish's, not ours, so the conversation-linking
           * update inside captureLead matches nothing and logs that it could
           * not attach. That is correct: Fish owns this conversation and we
           * hold no row for it. The lead itself is written either way. */
          const result = await captureLead({
            conversationId: input.session.id,
            sourceDetail: `fish-agent-${input.session.id}`,
            extraction: { ...contact, phone },
            transcript: [],
            existingLeadId: null,
            channel: "voice",
          });
          return json({ leadId: result.leadId, captured: result.captured });
        } catch (error) {
          console.error("[advisor:fish] could not write the lead", error);
          return json({ error: "Could not write the lead" }, 500);
        }
      },
    },
  },
});
