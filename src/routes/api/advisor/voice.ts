import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { advisor } from "@/config/advisor";
import { guessLanguage, type AdvisorTurn } from "@/data/advisor";
import {
  appendTurns,
  complete,
  fallbackReply,
  openConversation,
  prepareTurn,
  qualifiedFrom,
  RateLimited,
} from "@/data/advisor.server";
import { extractQualification, qualificationBag } from "@/data/advisor-capture.server";
import { synthesize, voiceConfigured } from "@/data/voice.server";

/**
 * POST /api/advisor/voice — one turn of a phone call.
 *
 * The telephony layer owns the call: it answers, transcribes what the caller
 * says, and plays back what we return. This endpoint owns the thinking, and it
 * is deliberately the *same* thinking as the chat — `prepareTurn` and the same
 * system prompt, with `channel: "voice"` changing only the delivery. There is
 * no second set of rules for the phone, because a second set of rules is a set
 * that drifts.
 *
 * Not streamed. A caller cannot listen to half a sentence, and the guardrails
 * are load-bearing on the second half: "the threshold is two million" and "the
 * threshold is two million, but confirm it, because it changes" are different
 * statements, and only one of them is allowed.
 *
 * Authenticated by a shared secret, because unlike the chat this is not
 * reachable from a browser and has no rate limiter in front of it.
 */
const requestSchema = z.object({
  /** The telephony provider's call id. Also the conversation's key. */
  callSid: z.string().min(3).max(128),
  /** What the caller just said, already transcribed. */
  utterance: z.string().trim().min(1).max(2000),
  callerNumber: z.string().max(40).optional(),
  language: z.string().max(12).optional(),
  /** Ask for audio back. Off by default: many stacks do their own speech. */
  speak: z.boolean().optional(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/advisor/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["VOICE_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[advisor:voice] VOICE_WEBHOOK_SECRET is not set; refusing every call");
          return json({ error: "Voice is not configured" }, 503);
        }
        if (request.headers.get("x-advisor-secret") !== secret) {
          return json({ error: "Unauthorized" }, 401);
        }

        let input: z.infer<typeof requestSchema>;
        try {
          input = requestSchema.parse(await request.json());
        } catch {
          return json({ error: "Bad request" }, 400);
        }

        const language = input.language ?? guessLanguage(input.utterance);

        let conversation;
        try {
          conversation = await openConversation({
            /* The call id is the session: a dropped and redialled call is a new
             * conversation, which is also how the caller experiences it. */
            sessionToken: `call:${input.callSid}`,
            channel: "voice",
            callSid: input.callSid,
            ...(input.callerNumber ? { callerNumber: input.callerNumber } : {}),
            ...(language ? { language } : {}),
          });
        } catch (error) {
          console.error("[advisor:voice] could not open the conversation", error);
          return json({ reply: fallbackReply("voice"), ended: true });
        }

        /* A caller who has been on for this long needs a person, not more of
         * this. The advisor says so rather than looping. */
        if (conversation.turn_count >= advisor.limitsPerSession.turns) {
          return json({
            reply:
              "We've covered a lot. Let me have one of our consultants call you back so you can go through it properly. Thank you for calling.",
            ended: true,
          });
        }

        const history = conversation.transcript ?? [];
        const askedAt = new Date().toISOString();

        let reply: string;
        try {
          const { messages } = await prepareTurn({
            channel: "voice",
            question: input.utterance,
            history,
            ...(language ? { language } : {}),
            qualified: qualifiedFrom(conversation.qualification),
          });
          /* Short: the style rules ask for two or three sentences, and a token
           * cap is the only thing that actually enforces it. */
          reply = await complete(messages, { maxTokens: 220 });
        } catch (error) {
          console.error("[advisor:voice] completion failed", error);
          return json({
            reply:
              error instanceof RateLimited
                ? "I'm sorry, I'm having trouble reaching my system. Can I take your name and number and have a consultant call you back?"
                : fallbackReply("voice"),
          });
        }

        if (!reply) reply = fallbackReply("voice");

        const turns: AdvisorTurn[] = [
          { role: "user", content: input.utterance, at: askedAt },
          { role: "advisor", content: reply, at: new Date().toISOString() },
        ];

        const full = [...history, ...turns];
        const extraction = await extractQualification(full).catch(() => null);

        try {
          await appendTurns(conversation.id, history, turns, {
            ...(language ? { language } : {}),
            ...(extraction ? { qualification: qualificationBag(extraction) } : {}),
          });
        } catch (error) {
          console.error("[advisor:voice] could not persist the turn", error);
        }

        /*
         * The lead is written when the call *ends*, by the summary webhook —
         * not here. A caller half way through giving a number should not
         * produce a lead with half a number in it, and the webhook has the
         * whole transcript to work from.
         */

        let audio: string | undefined;
        if (input.speak && voiceConfigured()) {
          const speech = await synthesize(reply);
          if (speech) audio = Buffer.from(speech.audio).toString("base64");
        }

        return json({
          reply,
          conversationId: conversation.id,
          ...(audio ? { audioBase64: audio, audioContentType: "audio/mpeg" } : {}),
        });
      },
    },
  },
});
