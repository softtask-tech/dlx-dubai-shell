/**
 * What the browser is allowed to know about the advisor's configuration.
 *
 * Just two booleans. The dock uses them to decide whether to appear at all: an
 * advisor that cannot answer is worse than no advisor, because it invites a
 * question and then fails in front of someone who was ready to trust it. On a
 * deployment with no keys set the rail simply is not there, and the site is the
 * site it was before Phase 5.
 */
import { createServerFn } from "@tanstack/react-start";

export type AdvisorAvailability = { chat: boolean; voice: boolean };

export const advisorAvailabilityFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvisorAvailability> => ({
    chat: Boolean(process.env["LOVABLE_API_KEY"]),
    voice: Boolean(process.env["FISH_AUDIO_API_KEY"]),
  }),
);
