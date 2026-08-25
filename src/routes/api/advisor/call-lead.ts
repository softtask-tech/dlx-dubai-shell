import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { AdvisorTurn } from "@/data/advisor";
import { captureLead, extractQualification } from "@/data/advisor-capture.server";

/**
 * POST /api/advisor/call-lead, turns a finished call into a scored lead.
 *
 * Called by the `advisor-call-summary` Edge Function, never by a browser. It
 * exists so that scoring has exactly one home: a call is scored by the same
 * `scoreLead` that scores a contact form, and fires the same two emails,
 * because "which channel did it come from" should change the attribution and
 * nothing else.
 *
 * The telephony layer may have captured contact details itself; whatever it did
 * not catch is read back out of the transcript. Details the provider gives are
 * trusted over the extractor's reading of the transcript, a number the caller
 * dialled from is better evidence than a number a model heard.
 */
const turnSchema = z.object({
  role: z.enum(["user", "advisor"]),
  content: z.string(),
  at: z.string().optional(),
});

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  callSid: z.string().min(3).max(128),
  callerNumber: z.string().max(40).nullish(),
  contact: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().max(200).optional(),
      phone: z.string().max(40).optional(),
    })
    .default({}),
  summary: z.string().max(4000).nullish(),
  transcript: z.array(turnSchema).max(400).default([]),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/advisor/call-lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["VOICE_WEBHOOK_SECRET"];
        if (!secret) return json({ error: "Voice is not configured" }, 503);
        if (request.headers.get("x-advisor-secret") !== secret) {
          return json({ error: "Unauthorized" }, 401);
        }

        let input: z.infer<typeof requestSchema>;
        try {
          input = requestSchema.parse(await request.json());
        } catch {
          return json({ error: "Bad request" }, 400);
        }

        const transcript: AdvisorTurn[] = input.transcript.map((turn) => ({
          role: turn.role,
          content: turn.content,
          at: turn.at ?? new Date().toISOString(),
        }));

        /* Read the transcript for anything the provider did not capture. */
        const extracted = (await extractQualification(transcript).catch(() => null)) ?? {};

        const contact = {
          ...extracted,
          ...(input.contact.name ? { name: input.contact.name } : {}),
          ...(input.contact.email ? { email: input.contact.email } : {}),
          /* The number they called from beats anything transcribed. */
          ...(input.contact.phone || input.callerNumber
            ? { phone: input.contact.phone ?? input.callerNumber ?? undefined }
            : {}),
          ...(input.summary ? { summary: input.summary } : {}),
        };

        if (!contact.email && !contact.phone) {
          /* A call with no way to reply is still on record as a conversation;
           * it is just not a lead. Saying so is more useful than a 500. */
          return json({ leadId: null, reason: "no contact details" });
        }

        try {
          const result = await captureLead({
            conversationId: input.conversationId,
            sourceDetail: `advisor-call-${input.callSid}`,
            extraction: contact,
            transcript,
            existingLeadId: null,
            channel: "voice",
          });
          return json({ leadId: result.leadId, captured: result.captured });
        } catch (error) {
          console.error("[advisor:call-lead] could not write the lead", error);
          return json({ error: "Could not write the lead" }, 500);
        }
      },
    },
  },
});
