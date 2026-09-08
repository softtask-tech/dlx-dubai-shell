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

export type AdvisorAvailability = {
  chat: boolean;
  /** Text to speech: an answer can be read aloud. */
  voice: boolean;
  /**
   * The Fish Audio agent, if one has been provisioned and published.
   *
   * Sent to the browser deliberately: it is a public agent id, the same one
   * the embed puts in the DOM, and the widget cannot be offered without it.
   * The API key stays on the server and is never part of this.
   */
  agentId: string | null;
};

export const advisorAvailabilityFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvisorAvailability> => ({
    chat: Boolean(process.env["LOVABLE_API_KEY"]),
    voice: Boolean(process.env["FISH_AUDIO_API_KEY"] ?? process.env["FISH_API"]),
    agentId: process.env["FISH_AGENT_ID"] ?? null,
  }),
);
