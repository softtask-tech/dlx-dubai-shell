import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";

import { advisor } from "@/config/advisor";
import { brand } from "@/config/brand";
import { isRtl } from "@/config/advisor";
import { guessLanguage } from "@/data/advisor";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { useAdvisor, type PanelTurn } from "./use-advisor";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

/**
 * The advisor, docked.
 *
 * A rail across the foot of the page rather than a circular bubble in the
 * corner. The bubble is the convention and it is the wrong one here: it reads
 * as support software bolted onto a brand, it hides who is talking, and it
 * competes with the page for attention it has not earned. A hairline rail
 * carrying a name and a role sits in the same register as the rest of the site
 *, it says someone is here, and waits.
 *
 * The rail never covers content: it is `sticky`-feeling but fixed and short,
 * and the footer carries bottom padding to match.
 */
export function AdvisorDock() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const pagePath = useRouterState({ select: (state) => state.location.pathname });

  /*
   * `#ask` opens the advisor, and `#ask=…` opens it on a question. It means a
   * page can hand a specific question over, "ask about this community" from an
   * area page, instead of dropping the reader into an empty panel and hoping
   * they remember what they wanted.
   */
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#ask")) return;
      const question = hash.startsWith("#ask=") ? decodeURIComponent(hash.slice(5)) : null;
      setOpening(question);
      setDismissed(false);
      setOpen(true);
      track("advisor_open", { contentName: "deep-link" });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  /* The advisor has no business on the admin desk. */
  if (pagePath.startsWith("/admin")) return null;

  return (
    <>
      {!open && !dismissed ? (
        <AdvisorRail onOpen={() => setOpen(true)} onDismiss={() => setDismissed(true)} />
      ) : null}
      {open ? (
        <AdvisorPanel
          pagePath={pagePath}
          {...(opening ? { initialQuestion: opening } : {})}
          onClose={() => {
            setOpen(false);
            setOpening(null);
          }}
        />
      ) : null}
    </>
  );
}

/** The resting state: a name, a role, and an invitation. */
function AdvisorRail({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:px-8 md:pb-6">
      <div className="pointer-events-auto flex w-full max-w-shell items-center justify-between gap-4 border border-border bg-background px-5 py-4 md:px-7">
        <button
          type="button"
          onClick={() => {
            track("advisor_open", { contentName: "rail" });
            onOpen();
          }}
          className="group flex flex-1 items-start gap-4 text-start"
          aria-label={`Ask ${advisor.name}, the ${advisor.role}`}
        >
          <span className="pt-1.5">
            <Presence />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-none">
              {advisor.name}
              <span className="caption ms-3 text-muted-foreground">{advisor.role}</span>
            </span>
            <span className="caption mt-1.5 block truncate text-muted-foreground transition-colors group-hover:text-accent">
              Ask about buying, returns, the Golden Visa or relocating
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="quiet" size="none" onClick={onOpen} className="hidden sm:inline-flex">
            Ask
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Hide the advisor"
            className="eyebrow px-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A slow pulse, the only animated thing on the page.
 *
 * "Presence" in the brief, and presence is the whole job: it should read as
 * someone waiting rather than something notifying. Under reduced motion it is a
 * plain dot, which says the same thing with less.
 */
function Presence() {
  const reduced = useReducedMotion();
  return (
    <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
      {!reduced ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
      ) : null}
      <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
    </span>
  );
}

function AdvisorPanel({
  pagePath,
  initialQuestion,
  onClose,
}: {
  pagePath: string;
  initialQuestion?: string;
  onClose: () => void;
}) {
  const { turns, sending, notice, turnsLeft, leadCaptured, send } = useAdvisor(pagePath);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asked = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* A question handed in from a link is asked once, on open. */
  useEffect(() => {
    if (!initialQuestion || asked.current) return;
    asked.current = true;
    void send(initialQuestion);
  }, [initialQuestion, send]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /* Follow the answer as it streams, unless the visitor has scrolled up to
   * re-read something, then leave them where they are. */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom) {
      element.scrollTo({ top: element.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }
  }, [turns, reduced]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`${advisor.name}, ${advisor.role}`}
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 md:inset-x-auto md:end-8 md:bottom-6 md:px-0"
    >
      <div className="flex h-[85svh] w-full flex-col border border-border bg-background shadow-[0_-1px_60px_rgba(0,0,0,0.08)] md:h-[78svh] md:max-h-[46rem] md:w-[27rem]">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <Presence />
            <div>
              <p className="font-display text-xl leading-none">{advisor.name}</p>
              <p className="caption mt-1.5 text-muted-foreground">{advisor.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the advisor"
            className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
          >
            Close
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {turns.length === 0 ? <Opening onPick={(prompt) => void send(prompt)} /> : null}

          <div className="space-y-7">
            {turns.map((turn, index) => (
              <Turn key={`${turn.at}-${index}`} turn={turn} />
            ))}
          </div>

          {notice ? (
            <p className="caption mt-7 border-s-2 border-accent ps-5 text-muted-foreground">
              {notice}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-border px-6 py-5">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={advisor.limitsPerSession.messageChars}
              dir={isRtl(guessLanguage(draft) ?? "en") ? "rtl" : "ltr"}
              placeholder={turnsLeft > 0 ? "Ask about Dubai property…" : "Ask a consultant instead"}
              disabled={turnsLeft === 0}
              aria-label="Your question"
              className="max-h-32 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              variant="quiet"
              size="none"
              onClick={submit}
              disabled={sending || draft.trim().length === 0}
            >
              {sending ? "…" : "Send"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="caption text-muted-foreground">{advisor.disclosure}</p>
            {/* The offer to talk sits next to the machine that is talking to
                you, which is the moment someone decides they would rather not
                type. */}
            <a
              href={`tel:${brand.contact.phoneE164}`}
              className="caption text-accent transition-colors hover:text-foreground"
            >
              Prefer to talk? Call {brand.contact.phone}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** The empty state: what the advisor is for, and four ways in. */
function Opening({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mb-8">
      <p className="body-text text-foreground">{advisor.greeting}</p>

      <ul className="mt-6 border-t border-border">
        {advisor.prompts.map((prompt) => (
          <li key={prompt} className="border-b border-border">
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className="w-full py-3 text-start text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>

      <Eyebrow className="mt-7 text-muted-foreground">How I work</Eyebrow>
      <ul className="mt-3 space-y-1.5">
        {advisor.limits.map((limit) => (
          <li key={limit} className="caption flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="text-accent">
              ,
            </span>
            <span>{limit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Turn({ turn }: { turn: PanelTurn }) {
  const rtl = isRtl(guessLanguage(turn.content) ?? "en");

  if (turn.role === "user") {
    return (
      <p
        dir={rtl ? "rtl" : "ltr"}
        className="ms-auto max-w-[85%] bg-secondary px-5 py-3.5 text-sm leading-relaxed text-foreground"
      >
        {turn.content}
      </p>
    );
  }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className={cn("max-w-[95%]", turn.failed && "opacity-60")}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {turn.content}
        {turn.streaming ? (
          <span
            className="ms-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-accent"
            aria-hidden="true"
          />
        ) : null}
      </p>

      {!turn.streaming && !turn.failed && turn.content.length > 0 ? (
        <ListenButton text={turn.content} />
      ) : null}

      {turn.citations && turn.citations.length > 0 ? (
        <ul className="mt-4 border-t border-border pt-3">
          {turn.citations.map((citation) => (
            <li key={`${citation.url}-${citation.label}`} className="py-1.5">
              <a
                href={citation.url}
                className="caption text-muted-foreground transition-colors hover:text-accent"
              >
                {citation.title}
              </a>
              <span className="caption block text-accent">
                {citation.label}
                {citation.updatedAt ? ` · updated ${citation.updatedAt.slice(0, 7)}` : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Reads one answer aloud, in the same voice the phone line uses.
 *
 * Renders nothing at all when speech is not configured, the endpoint answers
 * 204 and the control removes itself, rather than offering a button that fails.
 */
function ListenButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "unavailable">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  if (state === "unavailable") return null;

  async function play() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }

    setState("loading");
    try {
      const response = await fetch("/api/advisor/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.status === 204) {
        setState("unavailable");
        return;
      }
      if (!response.ok) throw new Error(`speak responded ${response.status}`);

      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setState("playing");
    } catch (error) {
      console.error("[advisor] could not play the answer", error);
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void play()}
      className="caption mt-3 text-muted-foreground transition-colors hover:text-accent"
    >
      {state === "loading" ? "Loading…" : state === "playing" ? "Stop" : "Listen"}
    </button>
  );
}
