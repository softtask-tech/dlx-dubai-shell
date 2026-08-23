/**
 * Speech, via Fish Audio.
 *
 * Two callers, one client: the telephony layer, which turns the advisor's reply
 * into what the caller hears, and the chat panel, which offers to read an answer
 * aloud. Both get the same voice, which is the point — the advisor should sound
 * like one thing whether you rang it or typed to it.
 *
 * Configuration rather than hard-coding, because the voice is a brand decision
 * the client will want to change without a deploy:
 *   FISH_AUDIO_API_KEY  — https://fish.audio account
 *   FISH_AUDIO_VOICE_ID — the reference model; falls back to the API default
 *   FISH_AUDIO_API_URL  — override for a region or a self-hosted endpoint
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

export function voiceConfigured(): boolean {
  return Boolean(process.env["FISH_AUDIO_API_KEY"]);
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
  const key = process.env["FISH_AUDIO_API_KEY"];
  if (!key) return null;

  const trimmed = text.trim().slice(0, 1200);
  if (trimmed.length === 0) return null;

  const endpoint = process.env["FISH_AUDIO_API_URL"] ?? DEFAULT_ENDPOINT;
  const voiceId = process.env["FISH_AUDIO_VOICE_ID"];

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        format: "mp3",
        /* Telephony downsamples anyway, and a smaller payload is a shorter
         * silence before the caller hears anything. */
        mp3_bitrate: 64,
        ...(voiceId ? { reference_id: voiceId } : {}),
      }),
      signal: options.signal ?? AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error(`[advisor:voice] Fish Audio responded ${response.status}`);
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
