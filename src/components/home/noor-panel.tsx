import { useState, type FormEvent } from "react";
import { ArrowRight, Mic, Phone } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { advisor } from "@/config/advisor";
import { site } from "@/config/site";
import type { AdvisorAvailability } from "@/data/advisor.functions";
import { useAdvisor } from "@/components/advisor/use-advisor";
import { cn } from "@/lib/utils";

/**
 * Noor, in the hero, where a property search bar would normally go.
 *
 * The search bar is the default move for a brokerage homepage and it is the
 * wrong one here: DLX has two live mandates, so a search box promises an
 * inventory that does not exist and the first thing a visitor does is find it
 * empty. What DLX actually has that competitors do not is an advisor that
 * checks itself against the official record, so that is what the hero offers.
 *
 * Everything in it is real. The chips send genuine questions to
 * `/api/advisor/chat` and the answer streams back from the same endpoint and
 * the same guardrails the dock uses; the citations shown are the ones the
 * server actually attached. Nothing is canned. A panel of invented answers
 * would be both a lie about a product that exists and the most recognisable
 * tell in the genre, and the site's whole argument is that its figures can be
 * checked.
 *
 * Where no model key is configured the panel does not pretend: the chips
 * become links to a human, and the input is not rendered at all.
 */
export function NoorPanel({ availability }: { availability: AdvisorAvailability }) {
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [draft, setDraft] = useState("");
  const { turns, sending, notice, send } = useAdvisor("/");

  const lastAsked = [...turns].reverse().find((turn) => turn.role === "user") ?? null;
  const answer = [...turns].reverse().find((turn) => turn.role === "advisor") ?? null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    void send(question);
  };

  return (
    <div className="glass-paper diagonal-panel p-7 shadow-[0_24px_60px_rgba(0,0,0,0.10)] sm:p-8 lg:p-9">
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
                mode === option ? "bg-green text-on-dark" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {mode === "chat" ? (
        <ChatMode
          availability={availability}
          asked={lastAsked?.content ?? null}
          answer={answer}
          sending={sending}
          notice={notice}
          draft={draft}
          setDraft={setDraft}
          onSubmit={onSubmit}
          onAsk={(question) => void send(question)}
        />
      ) : (
        <VoiceMode voiceConfigured={availability.voice} />
      )}
    </div>
  );
}

/** The three questions offered. Real ones, in the words a buyer would use. */
const OPENERS = [
  "What is Business Bay yielding right now?",
  "Do I qualify for a Golden Visa?",
  "Buying from abroad, where do I start?",
] as const;

function ChatMode({
  availability,
  asked,
  answer,
  sending,
  notice,
  draft,
  setDraft,
  onSubmit,
  onAsk,
}: {
  availability: AdvisorAvailability;
  asked: string | null;
  answer: ReturnType<typeof useAdvisor>["turns"][number] | null;
  sending: boolean;
  notice: string | null;
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onAsk: (question: string) => void;
}) {
  /* No key configured: offer a person instead of a broken control. */
  if (!availability.chat) {
    return (
      <div className="mt-7">
        <p className="body-text text-muted-foreground">
          Noor is offline on this deployment. A consultant answers the same questions.
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
      {asked ? (
        <p className="caption text-muted-foreground">
          <span className="sr-only">You asked: </span>
          {asked}
        </p>
      ) : null}

      {/* The answer, as it streams. `aria-live` so a screen reader hears it
          arrive rather than having to go looking for it. */}
      <div aria-live="polite" aria-atomic="false">
        {answer ? (
          <div className="mt-3 border-s-2 border-gold-ink bg-cream p-4">
            <p className="body-text text-foreground">
              {answer.content}
              {answer.streaming ? (
                <span aria-hidden className="ms-0.5 inline-block animate-pulse">
                  |
                </span>
              ) : null}
            </p>
            {answer.citations && answer.citations.length > 0 ? (
              <ul className="mt-3 border-t border-border pt-2">
                {answer.citations.map((citation) => (
                  <li key={`${citation.url}-${citation.label}`}>
                    <a href={citation.url} className="caption text-gold-ink hover:underline">
                      {citation.label}
                      {citation.updatedAt ? ` · ${citation.updatedAt.slice(0, 7)}` : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {notice ? <p className="caption mt-3 text-muted-foreground">{notice}</p> : null}

      {/* The openers stay available after an answer, so a second question is
          one tap rather than a typing job on a phone. */}
      <ul className="mt-4 grid gap-2">
        {OPENERS.map((question) => (
          <li key={question}>
            <button
              type="button"
              disabled={sending}
              onClick={() => onAsk(question)}
              className="focus-ring w-full border border-border bg-paper px-4 py-3 text-start text-sm text-foreground transition-colors hover:border-gold-ink hover:bg-cream disabled:opacity-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-3 border-t border-border pt-4">
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
          disabled={sending || draft.trim().length === 0}
          aria-label="Send question"
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-green text-on-dark transition-opacity disabled:opacity-40"
        >
          <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
      </form>
    </div>
  );
}

/**
 * Voice, described as what it actually is.
 *
 * The specification asked for a microphone button wired to the voice flow.
 * There is no such flow to wire it to: `/api/advisor/voice` is a telephony
 * webhook, authenticated by a shared secret and unreachable from a browser,
 * and the only browser-side voice feature is reading an answer aloud. A mic
 * button here would be a control that does nothing, which is exactly the
 * invented-interface problem the rest of this panel avoids.
 *
 * So voice is presented as the real thing it is: a phone line, answered by the
 * same advisor with the same guardrails.
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
              /* Ambient, and only where motion is welcome. It marks the phone
                 line, it is not a picture of Noor listening. */
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
          Answers can be read aloud in the full advisor.
        </p>
      ) : null}
    </div>
  );
}
