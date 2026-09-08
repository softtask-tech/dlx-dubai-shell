import { useEffect, useRef, useState } from "react";
import { PhoneOff } from "lucide-react";

import { advisor } from "@/config/advisor";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Talking to Noor, inside our own panel.
 *
 * Fish Audio ships an embeddable widget that registers a `<fish-agent>`
 * element from a script tag. Dropped on the page as documented it arrives as
 * its own floating bubble, which would put a second permanent object in the
 * corner beside the dock: the exact clutter the dock was rebuilt to remove.
 * So the element is mounted *inside* this panel, and everything around it,
 * including the state you are looking at while it connects, is ours.
 *
 * No npm package. The embed is a pre-bundled IIFE served from a CDN, loaded
 * once and only when someone actually asks to talk, so a visitor who never
 * presses the button never pays for it and never hands a third party a request.
 *
 * THE ANIMATION IS A STATUS, NOT A DECORATION. A voice call has dead air in
 * it: the second after you press call, the second after you stop speaking. In
 * that silence the only question a caller has is whether the thing is still
 * alive. So the rings carry the state rather than running as ambient
 * decoration, and each state looks different enough to read at a glance
 * without the label: connecting breathes slowly, live rides steadily, ended
 * stops dead. Under reduced motion nothing moves and the label does the work,
 * because someone who has asked for stillness should not be told the call
 * status in motion they cannot see.
 */
const EMBED_SRC = "https://unpkg.com/@fishaudio/agent-widget-embed";

type CallState = "idle" | "connecting" | "live" | "ended" | "unavailable";

export function VoiceCall({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const [state, setState] = useState<CallState>("idle");
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  /*
   * The embed is fetched on mount of this view, not on mount of the dock.
   * Opening the advisor to type should not cost a request to a third party.
   */
  useEffect(() => {
    let cancelled = false;
    setState("connecting");

    const existing = document.querySelector<HTMLScriptElement>(`script[data-fish-embed]`);
    const ready = () => {
      if (cancelled) return;
      /* The element defines itself when the bundle registers. If it has not
       * after the script resolves, something upstream changed and a dead
       * panel is worse than an honest one. */
      if (!customElements.get("fish-agent")) {
        setState("unavailable");
        return;
      }
      const host = mountRef.current;
      if (!host || host.querySelector("fish-agent")) return;
      const element = document.createElement("fish-agent");
      element.setAttribute("agent-id", agentId);
      host.append(element);
      setState("live");
    };

    if (existing) {
      if (customElements.get("fish-agent")) ready();
      else existing.addEventListener("load", ready, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = EMBED_SRC;
      script.async = true;
      script.dataset["fishEmbed"] = "true";
      script.addEventListener("load", ready, { once: true });
      script.addEventListener("error", () => {
        if (!cancelled) setState("unavailable");
      });
      document.head.append(script);
    }

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const label: Record<CallState, string> = {
    idle: "Getting ready",
    connecting: `Connecting you to ${advisor.name}`,
    live: `${advisor.name} is listening`,
    ended: "Call ended",
    unavailable: "The voice line will not start",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      {/*
       * Three rings and a core. The rings are separate elements rather than a
       * box-shadow so each can carry its own delay, which is what makes the
       * pulse read as travelling outward instead of throbbing in place.
       */}
      <div aria-hidden className="relative grid size-40 place-items-center">
        {[0, 1, 2].map((ring) => (
          <span
            key={ring}
            className={cn(
              "absolute rounded-full border",
              state === "live" ? "border-gold/45" : "border-gold/25",
              state === "unavailable" || state === "ended" ? "opacity-40" : "",
            )}
            style={{
              inset: `${ring * 14}px`,
              ...(reduced || state === "ended" || state === "unavailable"
                ? {}
                : {
                    animation: `noor-ring ${state === "live" ? "2.4s" : "3.4s"} ease-in-out ${
                      ring * 0.35
                    }s infinite`,
                  }),
            }}
          />
        ))}

        <span
          className={cn(
            "grid size-16 place-items-center rounded-full font-display text-2xl text-white",
            "bg-gradient-to-br from-gold to-green-mid",
            state === "ended" || state === "unavailable" ? "opacity-60 grayscale" : "",
          )}
        >
          {advisor.name.slice(0, 1)}
        </span>
      </div>

      <p aria-live="polite" className="lead mt-9 text-foreground">
        {label[state]}
      </p>

      <p className="caption mt-3 max-w-[26rem] text-muted-foreground">
        {state === "unavailable"
          ? "Something upstream is not answering. The written advisor still works, and the phone number in the header reaches a person."
          : `Ask about prices, rents or a community. ${advisor.disclosure} Anything that turns on your own circumstances goes to a consultant.`}
      </p>

      {/* Where the embed mounts. It carries its own controls, so the panel
          does not draw a second set that would disagree with them. */}
      <div ref={mountRef} className="mt-8 w-full" />

      <button
        type="button"
        onClick={() => {
          setState("ended");
          onClose();
        }}
        className="focus-ring eyebrow mt-10 inline-flex min-h-11 items-center gap-2 border border-border px-5 transition-colors hover:border-gold hover:text-gold-ink"
      >
        <PhoneOff aria-hidden className="size-4" />
        End and go back to typing
      </button>
    </div>
  );
}
