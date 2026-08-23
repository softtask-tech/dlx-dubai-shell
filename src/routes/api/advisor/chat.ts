import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { advisor } from "@/config/advisor";
import { guessLanguage, type AdvisorEvent, type AdvisorTurn } from "@/data/advisor";
import { captureLead, extractQualification, qualificationBag } from "@/data/advisor-capture.server";
import {
  appendTurns,
  checkIpRate,
  fallbackReply,
  hashIp,
  openConversation,
  prepareTurn,
  qualifiedFrom,
  RateLimited,
  streamCompletion,
  turnLimitReached,
} from "@/data/advisor.server";

/**
 * POST /api/advisor/chat — the advisor, streaming.
 *
 * Newline-delimited JSON rather than raw SSE, because more than prose is
 * travelling: the citations and the verification flag have to arrive attached
 * to the turn that earned them, so the panel can render the source line beside
 * the right answer instead of inferring it.
 *
 * Nothing here trusts the client. The session token identifies a conversation
 * but grants nothing — the row is only ever read with the service role — and the
 * transcript the model sees is the one in the database, not the one the browser
 * sent. A visitor who rewrites their own history in dev tools changes what they
 * see and nothing else.
 */
const requestSchema = z.object({
  sessionToken: z.string().min(16).max(128),
  message: z.string().trim().min(1).max(advisor.limitsPerSession.messageChars),
  pagePath: z.string().max(300).optional(),
  language: z.string().max(12).optional(),
});

/** One NDJSON frame. */
function frame(event: AdvisorEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function streamOf(events: AdvisorEvent[]): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) controller.enqueue(frame(event));
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export const Route = createFileRoute("/api/advisor/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof requestSchema>;
        try {
          input = requestSchema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        /* The address is hashed before it is used for anything, so neither the
         * rate limiter's memory nor the conversation row holds one. */
        const forwarded = request.headers.get("x-forwarded-for") ?? "";
        const ip = forwarded.split(",")[0]?.trim() || "unknown";
        const ipHash = await hashIp(ip);

        const rate = checkIpRate(ipHash);
        if (!rate.ok) {
          return streamOf([
            {
              type: "error",
              message: "per-ip rate limit",
              fallback: `You're going a little faster than I can keep up with. Give me ${rate.retryAfterSeconds} seconds.`,
              retryAfterSeconds: rate.retryAfterSeconds,
            },
          ]);
        }

        const language = input.language ?? guessLanguage(input.message);

        let conversation;
        try {
          conversation = await openConversation({
            sessionToken: input.sessionToken,
            channel: "chat",
            ...(language ? { language } : {}),
            ipHash,
          });
        } catch (error) {
          console.error("[advisor] could not open the conversation", error);
          return streamOf([
            {
              type: "error",
              message: "conversation store unavailable",
              fallback: fallbackReply("chat"),
            },
          ]);
        }

        if (turnLimitReached(conversation)) {
          return streamOf([
            {
              type: "error",
              message: "session turn limit",
              fallback:
                "We've covered a lot here. Rather than keep going in a chat window, let me put a consultant on it — leave a name and an email or phone number and they'll come back to you properly.",
            },
          ]);
        }

        const history = conversation.transcript ?? [];
        const askedAt = new Date().toISOString();

        let prepared;
        try {
          prepared = await prepareTurn({
            channel: "chat",
            question: input.message,
            history,
            ...(language ? { language } : {}),
            qualified: qualifiedFrom(conversation.qualification),
            ...(input.pagePath ? { pagePath: input.pagePath } : {}),
          });
        } catch (error) {
          console.error("[advisor] retrieval failed", error);
          return streamOf([
            { type: "error", message: "retrieval failed", fallback: fallbackReply("chat") },
          ]);
        }

        const { messages, context } = prepared;
        const citations = context.citations.map((citation) => ({
          label: citation.label,
          title: citation.title,
          url: citation.url,
          ...(citation.updatedAt ? { updatedAt: citation.updatedAt } : {}),
        }));

        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(
              frame({
                type: "meta",
                conversationId: conversation.id,
                sessionToken: conversation.session_token,
                citations,
                requiresVerification: context.requiresVerification,
              }),
            );

            let answer = "";
            try {
              for await (const delta of streamCompletion(messages, { signal: request.signal })) {
                answer += delta;
                controller.enqueue(frame({ type: "delta", text: delta }));
              }
            } catch (error) {
              const isRateLimit = error instanceof RateLimited;
              console.error("[advisor] completion failed", error);

              /* Partial answers are worse than none: a sentence that stops
               * before its caveat is exactly the failure the guardrails exist
               * to prevent. Say so instead. */
              const fallback = isRateLimit
                ? "I'm getting more questions than I can handle this minute. Try again shortly, or leave a name and a way to reach you and a consultant will pick it up."
                : fallbackReply("chat");

              controller.enqueue(
                frame({
                  type: "error",
                  message: error instanceof Error ? error.message : "unknown",
                  fallback,
                  ...(isRateLimit ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
                }),
              );
              controller.close();
              return;
            }

            const turns: AdvisorTurn[] = [
              { role: "user", content: input.message, at: askedAt },
              {
                role: "advisor",
                content: answer,
                at: new Date().toISOString(),
                ...(citations.length > 0 ? { citations } : {}),
              },
            ];

            /*
             * Everything from here runs after the visitor already has their
             * answer, which is the point: extraction costs a model call, and
             * nobody should wait on it to read a reply that is already written.
             * A failure in any of it costs a pre-filled field, never the answer.
             */
            const full = [...history, ...turns];
            let captured = false;

            const extraction = await extractQualification(full).catch(() => null);

            try {
              await appendTurns(conversation.id, history, turns, {
                ...(language ? { language } : {}),
                ...(extraction ? { qualification: qualificationBag(extraction) } : {}),
              });
            } catch (error) {
              console.error("[advisor] could not persist the turn", error);
            }

            if (extraction) {
              try {
                const result = await captureLead({
                  conversationId: conversation.id,
                  sourceDetail: `advisor-chat-${conversation.session_token.slice(0, 8)}`,
                  extraction,
                  transcript: full,
                  existingLeadId: conversation.lead_id,
                  channel: "chat",
                  ...(input.pagePath ? { pagePath: input.pagePath } : {}),
                });
                captured = result.captured;
              } catch (error) {
                console.error("[advisor] lead capture failed", error);
              }
            }

            controller.enqueue(
              frame({
                type: "done",
                turnCount: conversation.turn_count + 1,
                ...(captured ? { leadCaptured: true } : {}),
              }),
            );
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "application/x-ndjson; charset=utf-8",
            "cache-control": "no-store",
            /* Proxies that buffer would defeat the point of streaming. */
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
