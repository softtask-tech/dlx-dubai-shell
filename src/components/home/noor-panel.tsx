import { useState, type FormEvent } from "react";
import { ArrowRight, Mic, Phone } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { advisor } from "@/config/advisor";
import { site } from "@/config/site";
import type { AdvisorAvailability } from "@/data/advisor.functions";
import { cn } from "@/lib/utils";

/**
 * Noor, in the hero, where a property search bar would normally go.
 *
 * The search bar is the default move for a brokerage homepage and it is the
 * wrong one here: DLX has two live mandates, so a search box promises an
 * inventory that does not exist and the first thing a visitor does is find it
 * empty. What DLX has that competitors do not is an advisor that checks itself
 * against the official record, so that is what the hero offers.
 *
 * THIS PANEL DOES NOT ANSWER. It used to: a question streamed its reply into
 * the card, the card grew by a few hundred pixels, and the hero reflowed under
 * the reader while they were still on the headline. A hero has to be a fixed
 * shape. So the panel is the invitation and the floating advisor is the
 * conversation: a question here opens the dock in the corner with that question
 * already in it, and the answer arrives somewhere that is allowed to grow.
 *
 * `#ask=` is the deep link the dock already listens for, the same one the area
 * pages use. No second chat implementation and no duplicate session.
 */
export function NoorPanel({ availability }: { availability: AdvisorAvailability }) {
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [draft, setDraft] = useState("");

  /**
   * Hands a question to the floating advisor.
   *
   * The reset is not superstition: assigning the hash it already holds fires no
   * `hashchange`, so asking the same question twice would silently do nothing
   * the second time.
   */
  const ask = (question: string) => {
    const target = `#ask=${encodeURIComponent(question)}`;
    if (window.location.hash === target) window.location.hash = "";
    window.location.hash = target;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    ask(question);
  };

  return (
    <div className="glass-paper diagonal-panel shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
      <span aria-hidden className="block h-1 bg-gradient-to-r from-gold to-green-mid" />
      <div className="p-7 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-green-mid font-display text-lg text-white"
          >
            N
          </span>
          <span>
            <span className="font-display block text-base leading-tight">{advisor.name}</span>
            {/* The role never leaves the name's side. A human name on a machine
                is a lie waiting to be believed. */}
            <span className="eyebrow block text-gold-ink">{advisor.role}</span>
          </span>
        </div>

        <div
          role="group"
          aria-label="Advisor mode"
          className="flex shrink-0 rounded-full bg-cream p-1"
        >
          {(["chat", "voice"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "focus-ring rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                mode === option
                  ? "bg-green text-on-dark"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {mode === "chat" ? (
        <ChatInvitation
          availability={availability}
          draft={draft}
          setDraft={setDraft}
          onSubmit={onSubmit}
          onAsk={ask}
        />
      ) : (
        <VoiceMode voiceConfigured={availability.voice} />
      )}
      </div>
    </div>
  );
}

/** Three real questions, in the words a buyer would use. */
const OPENERS = [
  "What is Business Bay yielding right now?",
  "Do I qualify for a Golden Visa?",
  "Buying from abroad, where do I start?",
] as const;

function ChatInvitation({
  availability,
  draft,
  setDraft,
  onSubmit,
  onAsk,
}: {
  availability: AdvisorAvailability;
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onAsk: (question: string) => void;
}) {
  /* No key configured: offer a person instead of a control that fails. */
  if (!availability.chat) {
    return (
      <div className="mt-7">
        <p className="body-text text-muted-foreground">
          {advisor.name} is offline on this deployment. A consultant answers the same questions.
        </p>
        <a
          href="/contact"
          className="focus-ring eyebrow mt-6 inline-flex min-h-12 items-center bg-green px-6 text-on-dark"
        >
          Speak to a consultant
        </a>
      </div>
    );
  }

  return (
    <div className="mt-7">
      {/*
       * Hairline rows, not bordered boxes.
       *
       * Three outlined rectangles stacked in a card read as a form with three
       * disabled inputs, which is the opposite of an invitation: a box asks to
       * be filled in, a line asks to be followed. The rule is the separator
       * and the arrow is the affordance.
       */}
      <ul className="border-t border-border">
        {OPENERS.map((question) => (
          <li key={question} className="border-b border-border">
            <button
              type="button"
              onClick={() => onAsk(question)}
              className="focus-ring group flex w-full items-center justify-between gap-4 py-3.5 text-start text-sm text-foreground transition-[padding,color] duration-quick ease-editorial hover:ps-2 hover:text-gold-ink"
            >
              {question}
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 -translate-x-1 text-gold-ink opacity-0 transition-all duration-quick ease-editorial group-hover:translate-x-0 group-hover:opacity-100 rtl:-scale-x-100"
              />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-5 flex items-center gap-3">
        <label htmlFor="noor-hero-input" className="sr-only">
          Ask {advisor.name} about Dubai property
        </label>
        <input
          id="noor-hero-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={advisor.limitsPerSession.messageChars}
          placeholder="Ask about Dubai property"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          aria-label={`Ask ${advisor.name}`}
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-green text-on-dark transition-opacity disabled:opacity-40"
        >
          <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
      </form>

      <p className="caption mt-3 text-muted-foreground">Answers open in the advisor, bottom left.</p>
    </div>
  );
}

/**
 * Voice, described as what it actually is.
 *
 * There is no microphone button because there is no browser microphone flow to
 * wire one to: `/api/advisor/voice` is a telephony webhook, authenticated by a
 * shared secret and unreachable from a page. A mic here would be a control
 * connected to nothing. It is a phone line, so it is presented as one.
 */
function VoiceMode({ voiceConfigured }: { voiceConfigured: boolean }) {
  const reduced = useReducedMotion();

  return (
    <div className="mt-7 flex flex-col items-center py-4 text-center">
      <span aria-hidden className="flex h-11 items-end gap-1">
        {[14, 28, 40, 22, 34, 16].map((height, index) => (
          <span
            key={height}
            className="w-1 rounded-full bg-gold-ink"
            style={{
              height,
              animation: reduced ? undefined : `noor-wave 1.2s ease-in-out ${index * 0.1}s infinite`,
            }}
          />
        ))}
      </span>

      <p className="body-text mt-6 text-foreground">{advisor.name} answers on the phone too.</p>

      <a
        href={`tel:${site.contact.phoneE164}`}
        dir="ltr"
        className="focus-ring eyebrow mt-5 inline-flex min-h-12 items-center gap-2 bg-green px-6 text-on-dark"
      >
        <Phone aria-hidden className="size-4" />
        {site.contact.phone}
      </a>

      {voiceConfigured ? (
        <p className="caption mt-5 flex items-center gap-2 text-muted-foreground">
          <Mic aria-hidden className="size-3.5" />
          Answers can be read aloud in the advisor.
        </p>
      ) : null}
    </div>
  );
}
