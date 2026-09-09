/**
 * Server functions for the admin app.
 *
 * Each one takes the caller's access token and passes it through
 * `requireAdmin()` before touching anything. The token comes from the browser's
 * Supabase session; verifying it server-side is what makes the admin app safe
 * to expose on a public URL.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AdvisorConversationRow } from "./advisor-types";
import { CONTENT_TABLES, type ContentTable } from "./content-schema";
import type { Agent, JsonObject, Lead, LeadNote, Testimonial } from "./types";

const withToken = z.object({ accessToken: z.string().min(1) });

const leadStatuses = [
  "new",
  "contacted",
  "qualified",
  "viewing_booked",
  "negotiating",
  "won",
  "lost",
  "unqualified",
] as const;

const leadSourceTypes = [
  "contact_form",
  "valuation_form",
  "listing_enquiry",
  "guide_download",
  "calculator",
  "market_report",
  "ai_chat",
  "voice_call",
  "whatsapp",
  "referral",
  "other",
] as const;

const leadIntents = ["buy", "sell", "rent", "invest", "relocate", "advice"] as const;

const leadTimelines = [
  "immediately",
  "within_3_months",
  "within_12_months",
  "researching",
] as const;

export type LeadWithAgent = Lead & { assigned_agent: Pick<Agent, "id" | "full_name"> | null };

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Every way the desk can narrow the inbox.
 *
 * Shared by the list and the export deliberately: an export that quietly
 * ignored a filter would hand someone a spreadsheet that disagreed with the
 * screen they were looking at.
 */
const leadFilters = {
  status: z.enum(leadStatuses).optional(),
  temperature: z.enum(["hot", "warm", "cold"]).optional(),
  search: z.string().optional(),
  createdFrom: isoDate.optional(),
  createdTo: isoDate.optional(),
  sourceType: z.enum(leadSourceTypes).optional(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
  intent: z.enum(leadIntents).optional(),
  timeline: z.enum(leadTimelines).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  assignedAgentId: z.union([z.literal("unassigned"), z.string().uuid()]).optional(),
  notified: z.boolean().optional(),
} as const;

type LeadFilterInput = {
  [K in keyof typeof leadFilters]?: z.infer<(typeof leadFilters)[K]>;
};

/** Copies only the filters that were actually set. */
function toServerFilters(data: LeadFilterInput): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const key of Object.keys(leadFilters) as (keyof typeof leadFilters)[]) {
    const value = data[key];
    if (value !== undefined && value !== "") filters[key] = value;
  }
  return filters;
}

/** The inbox. */
export const listLeadsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend(leadFilters).parse(data),
  )
  .handler(async ({ data }): Promise<{ leads: LeadWithAgent[]; agents: Agent[] }> => {
    const { requireAdmin, listLeads, listAllAgents } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const filters = toServerFilters(data) as Parameters<typeof listLeads>[0];

    const [leads, agents] = await Promise.all([listLeads(filters), listAllAgents()]);
    return { leads, agents };
  });

/** One lead, with its notes. */
export const getLeadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withToken.extend({ id: z.string().uuid() }).parse(data))
  .handler(
    async ({
      data,
    }): Promise<{
      lead: LeadWithAgent;
      notes: LeadNote[];
      conversations: AdvisorConversationRow[];
    } | null> => {
      const { requireAdmin, getLead } = await import("./admin.server");
      await requireAdmin(data.accessToken);
      return getLead(data.id);
    },
  );

/** Tag a lead, or hand it to a consultant. */
export const updateLeadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken
      .extend({
        id: z.string().uuid(),
        status: z.enum(leadStatuses).optional(),
        assignedAgentId: z.string().uuid().nullable().optional(),
        dealValueAed: z.number().nonnegative().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { requireAdmin, updateLead } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const patch: {
      status?: Lead["status"];
      assignedAgentId?: string | null;
      dealValueAed?: number | null;
    } = {};
    if (data.status) patch.status = data.status;
    if (data.assignedAgentId !== undefined) patch.assignedAgentId = data.assignedAgentId;
    if (data.dealValueAed !== undefined) patch.dealValueAed = data.dealValueAed;

    await updateLead(data.id, patch);
    return { ok: true };
  });

export const addLeadNoteFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend({ leadId: z.string().uuid(), body: z.string().trim().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { requireAdmin, addLeadNote } = await import("./admin.server");
    const identity = await requireAdmin(data.accessToken);
    await addLeadNote(data.leadId, identity.userId, data.body);
    return { ok: true };
  });

/** CSV of the current filter, built server-side so the export matches the view. */
export const exportLeadsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend(leadFilters).parse(data),
  )
  .handler(async ({ data }): Promise<{ csv: string; filename: string }> => {
    const { requireAdmin, listLeads, leadsToCsv } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const filters = {
      ...toServerFilters(data),
      limit: 5000,
    } as Parameters<typeof listLeads>[0];

    const leads = await listLeads(filters);
    const stamp = new Date().toISOString().slice(0, 10);
    return { csv: leadsToCsv(leads), filename: `dlx-leads-${stamp}.csv` };
  });

/** Whether the signed-in user may see the admin app at all. */
export const checkAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withToken.parse(data))
  .handler(async ({ data }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { requireAdmin } = await import("./admin.server");
    try {
      const identity = await requireAdmin(data.accessToken);
      return { isAdmin: true, email: identity.email };
    } catch {
      return { isAdmin: false, email: null };
    }
  });

const contentTables = CONTENT_TABLES as unknown as readonly [ContentTable, ...ContentTable[]];

/** Rows for the content editor, drafts included. */
export const listContentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withToken.extend({ table: z.enum(contentTables) }).parse(data))
  .handler(async ({ data }): Promise<{ rows: JsonObject[] }> => {
    const { requireAdmin } = await import("./admin.server");
    const { listContent } = await import("./content.server");
    await requireAdmin(data.accessToken);
    return { rows: await listContent(data.table) };
  });

/** Create or update one row. */
export const saveContentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken
      .extend({
        table: z.enum(contentTables),
        id: z.string().uuid().optional(),
        values: z.record(z.string(), z.any()),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { requireAdmin } = await import("./admin.server");
    const { saveContent } = await import("./content.server");
    await requireAdmin(data.accessToken);
    return saveContent(data.table, data.values, data.id);
  });

export const deleteContentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend({ table: z.enum(contentTables), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { requireAdmin } = await import("./admin.server");
    const { deleteContent } = await import("./content.server");
    await requireAdmin(data.accessToken);
    await deleteContent(data.table, data.id);
    return { ok: true };
  });

/* --- Market data ---------------------------------------------------------- */

/** Refresh status, row counts by provenance, and the recent ingestion runs. */
export const marketDataStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withToken.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    const { getMarketDataStatus } = await import("./market-admin.server");
    await requireAdmin(data.accessToken);
    return getMarketDataStatus();
  });

/** Starts an ingestion run by hand. */
export const triggerSyncFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend({ dataset: z.enum(["transactions", "rents"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    const { requireAdmin } = await import("./admin.server");
    const { triggerSync } = await import("./market-admin.server");
    await requireAdmin(data.accessToken);
    return triggerSync(data.dataset);
  });

/** Recomputes the metrics from what is already stored. */
export const recomputeStatsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withToken.parse(data))
  .handler(async ({ data }): Promise<{ refreshed: number }> => {
    const { requireAdmin } = await import("./admin.server");
    const { recomputeStats } = await import("./market-admin.server");
    await requireAdmin(data.accessToken);
    return { refreshed: await recomputeStats() };
  });

export type { Agent, ContentTable, LeadNote, Testimonial };

/* ------------------------------------------------------------------ ROAS -- */

export const campaignPerformanceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken
      .extend({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(data.accessToken);
    const { campaignPerformance } = await import("./roas.server");
    return campaignPerformance({ from: data.from, to: data.to });
  });

export const importSpendFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken.extend({ csv: z.string().min(1).max(2_000_000) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ imported: number; errors: string[] }> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin(data.accessToken);
    const { importSpendCsv } = await import("./roas.server");
    return importSpendCsv(data.csv);
  });
