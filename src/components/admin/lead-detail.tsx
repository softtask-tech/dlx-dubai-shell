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
                    ? `${formatPrice(lead.budget_min, lead.budget_currency, "-")} - ${formatPrice(lead.budget_max, lead.budget_currency, "open")}`
                    : "Not stated"
                }
              />
              <Row label="Preferred contact" value={humanise(lead.preferred_contact)} />
              <Row
                label="Why this score"
                value={scoreReasons(lead).join(" · ") || "No qualification answers"}
              />
            </Section>

            {/* Two touches, shown separately. The campaign that introduced
                someone and the one they converted on are different questions,
                and on a purchase this size they are often months apart. */}
            <Section title="Attribution">
              <Row label="Source" value={humanise(lead.source_type)} />
              <Row label="Detail" value={lead.source_detail ?? "-"} />
              <Row label="Page" value={lead.page_path ?? "-"} />
              <Row label="Last touch" value={campaignOf(lead, "last")} />
              <Row label="First touch" value={campaignOf(lead, "first")} />
              <Row
                label="First seen"
                value={
                  extra(lead, "first_seen_at")
                    ? new Date(extra(lead, "first_seen_at")!).toLocaleString("en-GB")
                    : "-"
                }
              />
              <Row label="Landing page" value={lead.landing_page_url ?? "-"} />
              <Row label="Referrer" value={lead.referrer_url ?? "-"} />
              {/* Which platform can still match this lead to a click. Shown as
                  presence rather than value: the ids are long, opaque and of no
                  use to a person reading the panel, but whether they exist
                  decides whether a closed deal can be reported back. */}
              <Row label="Click ids" value={clickIdsOf(lead)} />
            </Section>

            <Section title="Routing">
              <Row
                label="Routed"
                value={
                  extra(lead, "routed_at")
                    ? new Date(extra(lead, "routed_at")!).toLocaleString("en-GB")
                    : "Not routed"
                }
              />
              <Row label="Decision" value={extra(lead, "routing_reason") ?? "-"} />
              <Row label="Speed to lead" value={speedToLead(lead)} />
              <Row label="Spam check" value={spamOf(lead)} />
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

/**
 * Reads a column the generated types do not know about yet.
 *
 * The Phase 6 migration adds attribution and routing columns; until the
 * generated Supabase types are regenerated they are invisible to TypeScript
 * even though every row carries them.
 */
function extra(lead: LeadWithAgent, key: string): string | null {
  const value = (lead as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function campaignOf(lead: LeadWithAgent, touch: "first" | "last"): string {
  const parts =
    touch === "last"
      ? [lead.utm_source, lead.utm_medium, lead.utm_campaign]
      : [
          extra(lead, "first_utm_source"),
          extra(lead, "first_utm_medium"),
          extra(lead, "first_utm_campaign"),
        ];

  return parts.filter(Boolean).join(" / ") || "Direct";
}

/** Which platforms can still tie this lead back to a click. */
function clickIdsOf(lead: LeadWithAgent): string {
  const present: string[] = [];
  if (lead.gclid || extra(lead, "gbraid") || extra(lead, "wbraid")) present.push("Google");
  if (lead.fbclid || extra(lead, "fbc")) present.push("Meta");
  if (extra(lead, "msclkid")) present.push("Microsoft");
  if (extra(lead, "ttclid")) present.push("TikTok");

  return present.length > 0
    ? `${present.join(", ")}. A closed deal can be reported back`
    : "None. A closed deal cannot be attributed to an ad";
}

/**
 * How long the lead waited for an owner.
 *
 * The single number most predictive of whether paid traffic converts, and the
 * one nobody measures because it is never written down anywhere.
 */
function speedToLead(lead: LeadWithAgent): string {
  const routedAt = extra(lead, "routed_at");
  if (!routedAt) return "-";

  const seconds = Math.round(
    (new Date(routedAt).getTime() - new Date(lead.created_at).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s after it arrived`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min after it arrived`;
  return `${Math.round(seconds / 3600)} h after it arrived`;
}

function spamOf(lead: LeadWithAgent): string {
  const record = lead as unknown as Record<string, unknown>;
  const score = record["spam_score"];
  if (typeof score !== "number") return "Not assessed";

  const reasons = Array.isArray(record["spam_reasons"]) ? (record["spam_reasons"] as string[]) : [];
  if (score === 0) return "Clean";
  return `${score}/100, ${reasons.join("; ") || "no reason recorded"}`;
}
