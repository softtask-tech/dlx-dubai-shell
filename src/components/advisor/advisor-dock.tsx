import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AudioLines, Phone, X } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { advisor } from "@/config/advisor";
import { followUpSuggestions, openingSuggestions } from "@/data/advisor-suggestions";
import { VoiceCall } from "@/components/advisor/voice-call";
import { brand } from "@/config/brand";
import { isRtl } from "@/config/advisor";
import { guessLanguage, type AdvisorTurn } from "@/data/advisor";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { useAdvisor, type PanelTurn } from "./use-advisor";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { trackContactHref } from "@/components/site/contact-link";

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
export function AdvisorDock({ agentId }: { agentId?: string | null }) {
  const [open, setOpen] = useState(false);
  /*
   * Typing or talking, never both at once in the same panel. The voice view
   * takes the whole body, because a call is not something you do while
   * reading a thread, and it only exists at all once an agent has been
   * provisioned: an offer to talk that cannot connect is worse than no offer.
   */
  const [mode, setMode] = useState<"chat" | "voice">("chat");
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
      {!open ? <AdvisorRail onOpen={() => setOpen(true)} /> : null}
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

/**
 * The resting state: a floating widget, not a bar.
 *
 * This used to be a full-width strip pinned across the bottom of every page,
 * the width of the content column. At that size it was not an invitation, it
 * was a second footer: it took a band of the screen permanently, it competed
 * with the page it was sitting on, and on a phone it stacked with the contact
 * bar into a wall of chrome.
 *
 * A widget should occupy the corner and nothing else. So it is a pill: the
 * mark, the name, the role, and a presence dot. It says who is waiting and
 * gets out of the way.
 *
 * Bottom right, and permanent. It carried a dismiss control before, which is
 * the convention for something a reader wants gone; this is the one feature on
 * the site that a first-time visitor most needs to find, so it stays.
 *
 * On a phone it lifts above the contact bar rather than sitting on top of it,
 * which is what the offset is doing. `start`/`end` throughout, so it moves to
 * the other corner on the Arabic pages instead of covering the text.
 */
function AdvisorRail({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed end-4 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-2 md:end-6 md:bottom-6">
      <button
        type="button"
        onClick={() => {
          track("advisor_open", { contentName: "rail" });
          onOpen();
        }}
        aria-label={`Ask ${advisor.name}, the ${advisor.role}`}
        className="focus-ring group flex items-center gap-3 border border-border bg-paper py-2 pe-5 ps-2 text-start shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-[border-color,box-shadow,transform] duration-quick ease-editorial hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
      >
        <span
          aria-hidden
          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-green-mid font-display text-lg text-white"
        >
          N
          <span className="absolute -end-0.5 -top-0.5">
            <Presence />
          </span>
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block font-display text-base leading-none">Ask {advisor.name}</span>
          <span className="caption mt-1 block text-muted-foreground transition-colors group-hover:text-gold-ink">
            {advisor.role}
          </span>
        </span>
      </button>

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
    <>
      {/*
       * A scrim on the phone, and only on the phone.
       *
       * Scrolling inside the widget used to carry through to the page behind
       * it once the transcript hit its end, so the site slid around under a
       * panel the reader thought they were inside. `overscroll-contain` on the
       * transcript stops the chaining; this stops everything else, and it also
       * puts the panel on a ground of its own instead of floating over live
       * content on a small screen.
       */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/45 md:hidden"
      />

      <div
        role="dialog"
        aria-modal="false"
        aria-label={`${advisor.name}, ${advisor.role}`}
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 md:inset-x-auto md:end-6 md:bottom-6 md:px-0"
      >
        {/*
         * A sheet on a phone, a panel on a desktop.
         *
         * Two things were wrong on a phone. It ran to the very bottom edge, so
         * on any handset with a home indicator the last line of the composer
         * sat under it; `pb-[env(safe-area-inset-bottom)]` gives that back.
         * And it arrived as a slab with no grip: nothing said it was a sheet
         * you could dismiss, so the only way out was hunting for the close
         * button. The bar at the top is that affordance, and tapping it closes.
         *
         * Square corners on purpose. The design system sets radius to zero
         * because a monograph has no rounded corners, and a sheet is not a
         * good enough reason to break that.
         */}
        <div className="flex h-[88dvh] max-h-[calc(100dvh-2rem)] w-full flex-col overscroll-contain border border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_24px_70px_rgba(0,0,0,0.20)] md:h-[74svh] md:max-h-[44rem] md:w-[26rem] md:pb-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the advisor"
          className="focus-ring grid shrink-0 place-items-center py-3 md:hidden"
        >
          <span aria-hidden className="block h-1 w-10 bg-border" />
        </button>
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <Presence />
            <div className="min-w-0">
              <p className="font-display truncate text-lg leading-none sm:text-xl">
                {advisor.name}
              </p>
              <p className="caption mt-1.5 truncate text-muted-foreground">{advisor.role}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {/* The other way to reach a person, one tap away, because the
                moment an answer is not enough is the moment they want a
                human and not a form. */}
            <a
              href={`tel:${brand.contact.phoneE164}`}
              dir="ltr"
              onClick={() => trackContactHref(`tel:${brand.contact.phoneE164}`, "advisor-widget")}
              aria-label={`Call DLX on ${brand.contact.phone}`}
              className="focus-ring grid size-10 place-items-center text-muted-foreground transition-colors hover:text-gold-ink"
            >
              <Phone aria-hidden className="size-4" />
            </a>
            {/* Only rendered once an agent is provisioned and published. An
                offer to talk that cannot connect is worse than no offer. */}
            {agentId && mode === "chat" ? (
              <button
                type="button"
                onClick={() => setMode("voice")}
                aria-label={`Talk to ${advisor.name}`}
                className="focus-ring grid size-10 place-items-center text-muted-foreground transition-colors hover:text-gold-ink"
              >
                <AudioLines aria-hidden className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the advisor"
              className="focus-ring grid size-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </header>

        {agentId && mode === "voice" ? (
          <VoiceCall agentId={agentId} onClose={() => setMode("chat")} />
        ) : (
          <>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
        >
          {turns.length === 0 ? (
            <Opening onPick={(prompt) => void send(prompt)} pagePath={pagePath} />
          ) : null}

          <div className="space-y-7">
            {turns.map((turn, index) => (
              <Turn key={`${turn.at}-${index}`} turn={turn} />
            ))}
          </div>

          {/*
           * What to ask next, read from the answer just given. Only while the
           * advisor is idle, because offering the next question underneath a
           * half-written one is noise.
           */}
          {turns.length > 0 && !sending ? <FollowUps turns={turns} onPick={(p) => void send(p)} /> : null}

          {notice ? (
            <p className="caption mt-7 border-s-2 border-accent ps-5 text-muted-foreground">
              {notice}
            </p>
          ) : null}
        </div>

        {/*
         * The composer, and nothing else it does not need.
         *
         * This footer carried the textarea, the AI disclosure and a "Prefer to
         * talk? Call +971..." line, the last of which wrapped to two lines on
         * a 26rem panel. Roughly a third of the panel's height was permanent
         * furniture on a phone, taken from the only part anyone came for.
         *
         * The call line is gone because the header has had a phone button in
         * it the whole time, one tap away, so this was the same offer twice.
         * The disclosure stays: it is one short line and a reader is entitled
         * to know at any moment that they are not talking to a person.
         */}
        <footer className="border-t border-border px-5 py-4 sm:px-6">
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

          <p className="caption mt-3 text-muted-foreground">{advisor.disclosure}</p>
        </footer>
          </>
        )}
        </div>
      </div>
    </>
  );
}

/** The empty state: what the advisor is for, and four ways in. */
function Opening({
  onPick,
  pagePath,
}: {
  onPick: (prompt: string) => void;
  pagePath: string;
}) {
  return (
    <div className="mb-8">
      <p className="body-text text-foreground">{advisor.greeting}</p>

      <ul className="mt-6 border-t border-border">
        {openingSuggestions(pagePath).map((prompt) => (
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
            {/* A rule, not a comma. Same collateral from the em-dash purge as
                the blog list markers carried. */}
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-gold-ink" />
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

/**
 * Three things worth asking next, offered rather than waited for.
 *
 * Set as quiet chips under the thread rather than as a list, because they sit
 * between an answer and the composer and should read as an aside a person
 * might take, not as a menu blocking the way to the box.
 */
function FollowUps({
  turns,
  onPick,
}: {
  turns: readonly AdvisorTurn[];
  onPick: (prompt: string) => void;
}) {
  const prompts = followUpSuggestions(turns);
  if (prompts.length === 0) return null;

  return (
    <div className="mt-7 border-t border-border pt-5">
      <p className="eyebrow text-muted-foreground">You could ask</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="focus-ring border border-border px-3 py-2 text-start text-sm text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
