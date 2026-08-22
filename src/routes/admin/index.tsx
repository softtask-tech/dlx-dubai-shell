import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useAdminSession } from "./route";
import {
  exportLeadsFn,
  listLeadsFn,
  updateLeadFn,
  type LeadWithAgent,
} from "@/data/admin.functions";
import type { Agent, LeadStatus } from "@/data/types";
import { formatPrice, humanise } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { LeadDetail } from "@/components/admin/lead-detail";
import { Select, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () =>
    pageHead({
      path: "/admin",
      title: "Leads inbox",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: LeadsInbox,
});

const STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "viewing_booked",
  "negotiating",
  "won",
  "lost",
  "unqualified",
];

function LeadsInbox() {
  const session = useAdminSession();
  const [leads, setLeads] = useState<LeadWithAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [temperature, setTemperature] = useState<"hot" | "warm" | "cold" | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listLeadsFn({
        data: {
          accessToken: session.accessToken,
          ...(status ? { status } : {}),
          ...(temperature ? { temperature } : {}),
          ...(search ? { search } : {}),
        },
      });
      setLeads(result.leads);
      setAgents(result.agents);
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load the inbox. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, status, temperature, search]);

  /* Debounced so typing in the search box does not fire a request per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  async function handleStatusChange(id: string, nextStatus: LeadStatus) {
    /* Optimistic: the desk should feel instant, and a failure re-loads truth. */
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status: nextStatus } : lead)),
    );
    try {
      await updateLeadFn({ data: { accessToken: session.accessToken, id, status: nextStatus } });
    } catch (updateError) {
      console.error(updateError);
      void load();
    }
  }

  async function handleExport() {
    const result = await exportLeadsFn({
      data: {
        accessToken: session.accessToken,
        ...(status ? { status } : {}),
        ...(temperature ? { temperature } : {}),
        ...(search ? { search } : {}),
      },
    });

    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const counts = {
    hot: leads.filter((lead) => lead.temperature === "hot").length,
    unworked: leads.filter((lead) => lead.status === "new").length,
    undelivered: leads.filter((lead) => lead.admin_notified_at === null).length,
  };

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Pipeline</Eyebrow>
          <h1 className="display-2 mt-4">Leads</h1>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <Stat label="Hot" value={counts.hot} />
          <Stat label="Unworked" value={counts.unworked} />
          <Stat label="No email sent" value={counts.undelivered} />
          <Button variant="ghost" onClick={handleExport} disabled={leads.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-end gap-8 border-y border-border py-6">
        <label className="flex flex-col gap-2">
          <span className="eyebrow">Status</span>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus | "")}
          >
            <option value="">All</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {humanise(value)}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">Temperature</span>
          <Select
            value={temperature}
            onChange={(event) => setTemperature(event.target.value as typeof temperature)}
          >
            <option value="">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </label>

        <label className="flex flex-1 flex-col gap-2">
          <span className="eyebrow">Search</span>
          <TextInput
            placeholder="Name, email or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="caption mt-8 text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="eyebrow mt-12">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="body-text mt-12 text-muted-foreground">
          No leads match that. When enquiries come in they appear here immediately.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Received", "Name", "Intent", "Budget", "Source", "Score", "Status", ""].map(
                  (heading) => (
                    <th key={heading} className="eyebrow py-4 pr-6 text-left font-normal">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/60 align-top">
                  <td className="caption py-5 pr-6 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-5 pr-6">
                    <p className="body-text">{lead.full_name ?? "—"}</p>
                    <p className="caption">{lead.email ?? lead.phone ?? "—"}</p>
                  </td>
                  <td className="caption py-5 pr-6">
                    {humanise(lead.intent)}
                    <br />
                    {humanise(lead.timeline)}
                  </td>
                  <td className="caption py-5 pr-6 whitespace-nowrap">
                    {lead.budget_max
                      ? formatPrice(lead.budget_max, lead.budget_currency, "—")
                      : "—"}
                  </td>
                  <td className="caption py-5 pr-6">
                    {humanise(lead.source_type)}
                    {lead.utm_source ? <br /> : null}
                    {lead.utm_source ? `via ${lead.utm_source}` : null}
                  </td>
                  <td className="py-5 pr-6">
                    <TemperatureTag temperature={lead.temperature} score={lead.score} />
                  </td>
                  <td className="py-5 pr-6">
                    <Select
                      value={lead.status}
                      onChange={(event) =>
                        void handleStatusChange(lead.id, event.target.value as LeadStatus)
                      }
                      className="pb-1"
                    >
                      {STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {humanise(value)}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-5">
                    <button
                      type="button"
                      onClick={() => setSelected(lead.id)}
                      className="eyebrow link-underline text-accent"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <LeadDetail
          leadId={selected}
          agents={agents}
          accessToken={session.accessToken}
          onClose={() => setSelected(null)}
          onChanged={() => void load()}
        />
      ) : null}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="display-3 mt-1">{value}</p>
    </div>
  );
}

function TemperatureTag({ temperature, score }: { temperature: string; score: number }) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 rounded-full",
          temperature === "hot" && "bg-accent",
          temperature === "warm" && "bg-foreground/40",
          temperature === "cold" && "bg-border",
        )}
      />
      <Tag variant="bare">
        {temperature} · {score}
      </Tag>
    </span>
  );
}
