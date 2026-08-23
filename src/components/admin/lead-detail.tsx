import { useCallback, useEffect, useState } from "react";

import { addLeadNoteFn, getLeadFn, updateLeadFn, type LeadWithAgent } from "@/data/admin.functions";
import type { AdvisorConversationRow } from "@/data/advisor-types";
import type { Agent, LeadNote } from "@/data/types";
import { formatPrice, humanise } from "@/lib/format";
import { ConversationLog } from "./conversation-log";
import { Select, TextArea } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

/**
 * One lead, in full: the qualification answers, the attribution trail, whether
 * the emails actually went out, and the notes the team has added.
 *
 * A side panel rather than a route, so the desk keeps its place in the list.
 */
export function LeadDetail({
  leadId,
  agents,
  accessToken,
  onClose,
  onChanged,
}: {
  leadId: string;
  agents: readonly Agent[];
  accessToken: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [lead, setLead] = useState<LeadWithAgent | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [conversations, setConversations] = useState<AdvisorConversationRow[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await getLeadFn({ data: { accessToken, id: leadId } });
    if (result) {
      setLead(result.lead);
      setNotes(result.notes);
      setConversations(result.conversations);
    }
  }, [accessToken, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Escape closes the panel, as it would anywhere else on the site. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function assign(agentId: string) {
    setBusy(true);
    await updateLeadFn({
      data: { accessToken, id: leadId, assignedAgentId: agentId === "" ? null : agentId },
    });
    setBusy(false);
    await load();
    onChanged();
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    await addLeadNoteFn({ data: { accessToken, leadId, body: note } });
    setNote("");
    setBusy(false);
    await load();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 cursor-default"
      />
      <div
        role="dialog"
        aria-label="Lead detail"
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-10"
      >
        {!lead ? (
          <p className="eyebrow">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-6">
              <div>
                <Eyebrow>
                  {lead.temperature} · score {lead.score}
                </Eyebrow>
                <h2 className="display-2 mt-4">{lead.full_name ?? "Unnamed enquiry"}</h2>
                <p className="caption mt-3">{new Date(lead.created_at).toLocaleString("en-GB")}</p>
              </div>
              <button type="button" onClick={onClose} className="eyebrow link-underline">
                Close
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6">
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="eyebrow link-underline text-foreground">
                  {lead.email}
                </a>
              ) : null}
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="eyebrow link-underline text-foreground">
                  {lead.phone}
                </a>
              ) : null}
              {lead.phone ? (
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eyebrow link-underline text-foreground"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>

            {lead.message ? (
              <div className="mt-10">
                <Eyebrow>Their message</Eyebrow>
                <p className="body-text mt-4 bg-secondary p-6">{lead.message}</p>
              </div>
            ) : null}

            <ConversationLog conversations={conversations} />

            <Section title="Qualification">
              <Row label="Intent" value={humanise(lead.intent)} />
              <Row label="Timeline" value={humanise(lead.timeline)} />
              <Row
                label="Budget"
                value={
                  lead.budget_min || lead.budget_max
                    ? `${formatPrice(lead.budget_min, lead.budget_currency, "—")} – ${formatPrice(lead.budget_max, lead.budget_currency, "open")}`
                    : "Not stated"
                }
              />
              <Row label="Preferred contact" value={humanise(lead.preferred_contact)} />
              <Row
                label="Why this score"
                value={scoreReasons(lead).join(" · ") || "No qualification answers"}
              />
            </Section>

            <Section title="Attribution">
              <Row label="Source" value={humanise(lead.source_type)} />
              <Row label="Detail" value={lead.source_detail ?? "—"} />
              <Row label="Page" value={lead.page_path ?? "—"} />
              <Row label="UTM source" value={lead.utm_source ?? "Direct"} />
              <Row label="UTM medium" value={lead.utm_medium ?? "—"} />
              <Row label="UTM campaign" value={lead.utm_campaign ?? "—"} />
              <Row label="Landing page" value={lead.landing_page_url ?? "—"} />
              <Row label="Referrer" value={lead.referrer_url ?? "—"} />
            </Section>

            <Section title="Delivery">
              <Row
                label="Admin notified"
                value={
                  lead.admin_notified_at
                    ? new Date(lead.admin_notified_at).toLocaleString("en-GB")
                    : "Not sent"
                }
              />
              <Row
                label="Client confirmed"
                value={
                  lead.client_confirmed_at
                    ? new Date(lead.client_confirmed_at).toLocaleString("en-GB")
                    : "Not sent"
                }
              />
            </Section>

            <div className="mt-10">
              <Eyebrow>Assigned to</Eyebrow>
              <Select
                className="mt-3"
                value={lead.assigned_agent_id ?? ""}
                disabled={busy}
                onChange={(event) => void assign(event.target.value)}
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-12">
              <Eyebrow>Notes</Eyebrow>
              <form onSubmit={addNote} className="mt-4">
                <TextArea
                  rows={3}
                  placeholder="What happened on the call?"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button type="submit" className="mt-4" disabled={busy || !note.trim()}>
                  Add note
                </Button>
              </form>

              <ul className="mt-8">
                {notes.map((entry) => (
                  <li key={entry.id} className="border-t border-border py-5">
                    <p className="body-text">{entry.body}</p>
                    <p className="caption mt-2">
                      {new Date(entry.created_at).toLocaleString("en-GB")}
                    </p>
                  </li>
                ))}
                {notes.length === 0 ? <li className="caption py-5">No notes yet.</li> : null}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The scoring rationale stored alongside the answers when the lead came in. */
function scoreReasons(lead: LeadWithAgent): string[] {
  const reasons = lead.qualification_answers["score_reasons"];
  return Array.isArray(reasons) ? reasons.map(String) : [];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <Eyebrow>{title}</Eyebrow>
      <dl className="mt-4">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-6 border-t border-border/60 py-3">
      <dt className="caption w-40 shrink-0">{label}</dt>
      <dd className="body-text break-all">{value}</dd>
    </div>
  );
}
