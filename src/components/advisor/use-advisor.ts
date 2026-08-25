import { useCallback, useEffect, useRef, useState } from "react";

import { advisor } from "@/config/advisor";
import {
  createEventParser,
  newSessionToken,
  type AdvisorCitation,
  type AdvisorTurn,
} from "@/data/advisor";
import { newEventId, track } from "@/lib/tracking";

/** A turn plus the state the panel needs while it is still arriving. */
export type PanelTurn = AdvisorTurn & { streaming?: boolean; failed?: boolean };

const STORAGE_KEY = "dlx.advisor.session";

/**
 * The conversation, client side.
 *
 * The session token lives in `sessionStorage` rather than `localStorage`: a
 * conversation about someone's budget should not still be sitting there on a
 * shared machine tomorrow. It survives a page navigation, which is all it needs
 * to do, and the server holds the authoritative transcript anyway.
 */
export function useAdvisor(pagePath: string) {
  const [turns, setTurns] = useState<PanelTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfter] = useState<number | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY);
      sessionRef.current = existing ?? newSessionToken();
      sessionStorage.setItem(STORAGE_KEY, sessionRef.current);
    } catch {
      /* Private mode, or storage disabled. A token that lasts one page load is
       * still a working conversation. */
      sessionRef.current = newSessionToken();
    }
  }, []);

  /* Never leave a request running after the panel goes away. */
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || sending) return;

      setNotice(null);
      setRetryAfter(null);
      setSending(true);

      /* A question asked is a real intent signal, often a better one than a
       * half-filled form, since nobody types a paragraph about their budget by
       * accident. */
      track("advisor_message", { contentName: pagePath });

      const askedAt = new Date().toISOString();
      setTurns((current) => [
        ...current,
        { role: "user", content: text, at: askedAt },
        { role: "advisor", content: "", at: askedAt, streaming: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      /** Rewrites the in-flight advisor turn. */
      const patchLast = (patch: (turn: PanelTurn) => PanelTurn) =>
        setTurns((current) =>
          current.map((turn, index) => (index === current.length - 1 ? patch(turn) : turn)),
        );

      try {
        const response = await fetch("/api/advisor/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionToken: sessionRef.current, message: text, pagePath }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(`Advisor responded ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const parse = createEventParser();
        let citations: AdvisorCitation[] = [];

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const event of parse(decoder.decode(value, { stream: true }))) {
            switch (event.type) {
              case "meta":
                citations = event.citations;
                break;
              case "delta":
                patchLast((turn) => ({ ...turn, content: turn.content + event.text }));
                break;
              case "error":
                setNotice(event.fallback);
                setRetryAfter(event.retryAfterSeconds ?? null);
                patchLast((turn) => ({ ...turn, streaming: false, failed: true }));
                break;
              case "done":
                if (event.leadCaptured) {
                  setLeadCaptured(true);
                  /* The server wrote the lead; the browser reports the
                   * conversion with an id the server-side copy will share. */
                  track("advisor_lead", { eventId: newEventId(), contentName: pagePath });
                }
                patchLast((turn) => ({
                  ...turn,
                  streaming: false,
                  ...(citations.length > 0 ? { citations } : {}),
                }));
                break;
            }
          }
        }

        /* A stream that ended without a `done` frame still has to settle, or
         * the panel shows a caret blinking forever. */
        patchLast((turn) => (turn.streaming ? { ...turn, streaming: false } : turn));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[advisor] request failed", error);
        setNotice(
          "I couldn't reach my system just then. Try again in a moment, or ask us directly and a consultant will pick it up.",
        );
        patchLast((turn) => ({ ...turn, streaming: false, failed: true }));
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [pagePath, sending],
  );

  return {
    /* An advisor turn that arrived empty is dropped, so the transcript reads
     * cleanly rather than showing a blank bubble. */
    turns: turns.filter(
      (turn) => turn.role === "user" || turn.content.length > 0 || turn.streaming,
    ),
    sending,
    notice,
    retryAfterSeconds,
    turnsLeft: Math.max(
      0,
      advisor.limitsPerSession.turns - turns.filter((turn) => turn.role === "user").length,
    ),
    leadCaptured,
    send,
  };
}
