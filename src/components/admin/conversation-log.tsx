import { useState } from "react";

import type { AdvisorConversationRow } from "@/data/advisor-types";
import { advisor } from "@/config/advisor";
import { languageLabel } from "@/config/advisor";
import { Eyebrow } from "@/components/ui/section";

/**
 * What the advisor and the visitor actually said.
 *
 * The summary is the thing a consultant reads before calling back, so it leads.
 * The transcript sits behind a disclosure because it is long and only sometimes
 * wanted, but it is always there, because a summary is an interpretation and
 * the desk should be able to check it against the words.
 *
 * A chat and a phone call render identically. They are stored identically, and
 * the difference that matters to whoever is picking this lead up is the label
 * and the duration, not the layout.
 */
export function ConversationLog({
  conversations,
}: {
  conversations: readonly AdvisorConversationRow[];
}) {
  if (conversations.length === 0) return null;

  return (
    <div className="mt-10">
      <Eyebrow>
        {advisor.name} · {conversations.length === 1 ? "conversation" : "conversations"}
      </Eyebrow>
      <div className="mt-4 space-y-6">
        {conversations.map((conversation) => (
          <Conversation key={conversation.id} conversation={conversation} />
        ))}
      </div>
    </div>
  );
}

function Conversation({ conversation }: { conversation: AdvisorConversationRow }) {
  const [open, setOpen] = useState(false);
  const turns = Array.isArray(conversation.transcript) ? conversation.transcript : [];

  return (
    <div className="border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border bg-secondary px-5 py-3">
        <span className="eyebrow">
          {conversation.channel === "voice" ? "Phone call" : "Chat"}
          {conversation.call_seconds !== null
            ? ` · ${formatDuration(conversation.call_seconds)}`
            : null}
        </span>
        <span className="caption text-muted-foreground">
          {new Date(conversation.started_at).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          {languageLabel(conversation.language)}
          {" · "}
          {turns.filter((turn) => turn.role === "user").length} from them
        </span>
      </div>

      <div className="px-5 py-4">
        {conversation.summary ? (
          <p className="body-text text-foreground">{conversation.summary}</p>
        ) : (
          <p className="caption text-muted-foreground">No summary. Read the transcript below.</p>
        )}

        {conversation.caller_number ? (
          <p className="caption mt-3 text-muted-foreground">
            Called from {conversation.caller_number}
          </p>
        ) : null}

        {turns.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              className="eyebrow mt-5 text-muted-foreground transition-colors hover:text-accent"
            >
              {open ? "Hide transcript" : `Read the transcript (${turns.length} turns)`}
            </button>

            {open ? (
              <ol className="mt-5 space-y-4 border-t border-border pt-5">
                {turns.map((turn, index) => (
                  <li key={`${turn.at}-${index}`}>
                    <span className="eyebrow block text-muted-foreground">
                      {turn.role === "user" ? "Them" : advisor.name}
                    </span>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {turn.content}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}
