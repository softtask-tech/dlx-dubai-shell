import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { checkIpRate, hashIp } from "@/data/advisor.server";
import { synthesize, voiceConfigured } from "@/data/voice.server";

/**
 * POST /api/advisor/speak, reads an answer aloud.
 *
 * The same voice the phone line uses, offered on the page. It is an
 * accessibility affordance first: an advisor that can only be read excludes
 * people, and several of this site's audiences are far more comfortable
 * listening in their own language than reading English.
 *
 * Synthesis costs money per character, so this is rate limited on the same
 * counter as the chat and capped hard on length. A 204 means "no voice
 * configured", the panel hides the control rather than showing one that fails.
 */
const requestSchema = z.object({ text: z.string().trim().min(1).max(1200) });

export const Route = createFileRoute("/api/advisor/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!voiceConfigured()) return new Response(null, { status: 204 });

        const forwarded = request.headers.get("x-forwarded-for") ?? "";
        const ip = forwarded.split(",")[0]?.trim() || "unknown";
        const rate = checkIpRate(await hashIp(ip));
        if (!rate.ok) {
          return new Response("Too many requests", {
            status: 429,
            headers: { "retry-after": String(rate.retryAfterSeconds) },
          });
        }

        let input: z.infer<typeof requestSchema>;
        try {
          input = requestSchema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const speech = await synthesize(input.text);
        if (!speech) return new Response(null, { status: 204 });

        return new Response(speech.audio, {
          headers: {
            "content-type": speech.contentType,
            "cache-control": "no-store",
            "content-length": String(speech.audio.byteLength),
          },
        });
      },
    },
  },
});
