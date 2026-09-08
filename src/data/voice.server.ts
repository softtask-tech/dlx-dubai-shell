/**
 * Speech, via Fish Audio.
 *
 * Two callers, one client: the telephony layer, which turns the advisor's reply
 * into what the caller hears, and the chat panel, which offers to read an answer
 * aloud. Both get the same voice, which is the point, the advisor should sound
 * like one thing whether you rang it or typed to it.
 *
 * Configuration rather than hard-coding, because the voice is a brand decision
 * the client will want to change without a deploy:
 *   FISH_AUDIO_API_KEY (or FISH_API), https://fish.audio account
 *   FISH_AUDIO_VOICE_ID, the reference model; falls back to the API default
 *   FISH_AUDIO_MODEL, the TTS engine: s1, s2-pro, s2.1-pro, s2.1-pro-free
 *   FISH_AUDIO_LATENCY, low | balanced | normal
 *   FISH_AUDIO_API_URL, override for a region or a self-hosted endpoint
 *
 * FISH_AUDIO_MODEL is the one that bites. Fish Audio bills per model and the
 * free developer tier only serves `s2.1-pro-free`; send no header and the API
 * defaults to the paid `s2.1-pro`, which answers a free-tier key with 402 and
 * no audio. It is deliberately not defaulted here — guessing the tier would
 * either downgrade a paying account's voice or silently fail a free one — so
 * it is left unset and the error path below names the variable.
 *
 * Unconfigured, `synthesize` returns null rather than throwing. A missing voice
 * should cost the audio, not the answer: the panel simply shows text, and the
 * telephony layer falls back to its own text-to-speech.
 */

const DEFAULT_ENDPOINT = "https://api.fish.audio/v1/tts";

export type Speech = {
  /** MPEG audio. */
  audio: ArrayBuffer;
  contentType: string;
};

/** The key, under either name it is stored as. */
export function fishAudioKey(): string | undefined {
  return process.env["FISH_AUDIO_API_KEY"] ?? process.env["FISH_API"];
}

export function voiceConfigured(): boolean {
  return Boolean(fishAudioKey());
}

/**
 * Turns text into speech.
 *
 * The text is capped before it is sent: a runaway reply is a bill and a caller
 * listening to two minutes of monologue, and the prompt already tells the
 * advisor to keep voice turns to a few sentences. This is the backstop for when
 * it does not.
 */
export async function synthesize(
  text: string,
  options: { signal?: AbortSignal } = {},
): Promise<Speech | null> {
  const key = fishAudioKey();
  if (!key) return null;

  const trimmed = text.trim().slice(0, 1200);
  if (trimmed.length === 0) return null;

  const endpoint = process.env["FISH_AUDIO_API_URL"] ?? DEFAULT_ENDPOINT;
  const voiceId = process.env["FISH_AUDIO_VOICE_ID"];
  const model = process.env["FISH_AUDIO_MODEL"];
  /* Time to first audio matters more than absolute fidelity for both callers:
   * one is holding a phone to their ear and the other pressed play. */
  const latency = process.env["FISH_AUDIO_LATENCY"] ?? "balanced";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        /* Selects the TTS engine. Sent only when configured: the API has its
         * own default and overriding it blind is worse than deferring. */
        ...(model ? { model } : {}),
      },
      body: JSON.stringify({
        text: trimmed,
        format: "mp3",
        /* Telephony downsamples anyway, and a smaller payload is a shorter
         * silence before the caller hears anything. */
        mp3_bitrate: 64,
        latency,
        ...(voiceId ? { reference_id: voiceId } : {}),
      }),
      signal: options.signal ?? AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      /*
       * Say which failure this is.
       *
       * A bare status number here has cost hours before: 401 and 402 are both
       * "no audio came out" on the page and completely different problems in
       * the dashboard, and 402 on a key that plainly works is almost always
       * the free-tier model, not an unpaid bill.
       */
      const detail = await response.text().catch(() => "");
      const advice =
        response.status === 401
          ? "the key was rejected — check FISH_AUDIO_API_KEY (or FISH_API)"
          : response.status === 402
            ? "payment required — on the free developer tier set FISH_AUDIO_MODEL=s2.1-pro-free, otherwise check billing"
            : response.status === 503
              ? "Fish Audio is overloaded; the caller falls back to provider speech"
              : "unexpected response";
      console.error(
        `[advisor:voice] Fish Audio responded ${response.status}: ${advice}${detail ? ` — ${detail.slice(0, 300)}` : ""}`,
      );
      return null;
    }

    return {
      audio: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  } catch (error) {
    console.error("[advisor:voice] synthesis failed", error);
    return null;
  }
}
