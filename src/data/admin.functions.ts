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

export type LeadWithAgent = Lead & { assigned_agent: Pick<Agent, "id" | "full_name"> | null };

/** The inbox. */
export const listLeadsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    withToken
      .extend({
        status: z.enum(leadStatuses).optional(),
        temperature: z.enum(["hot", "warm", "cold"]).optional(),
        search: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ leads: LeadWithAgent[]; agents: Agent[] }> => {
    const { requireAdmin, listLeads, listAllAgents } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const filters: Parameters<typeof listLeads>[0] = {};
    if (data.status) filters.status = data.status;
    if (data.temperature) filters.temperature = data.temperature;
    if (data.search) filters.search = data.search;

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
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { requireAdmin, updateLead } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const patch: { status?: Lead["status"]; assignedAgentId?: string | null } = {};
    if (data.status) patch.status = data.status;
    if (data.assignedAgentId !== undefined) patch.assignedAgentId = data.assignedAgentId;

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
    withToken
      .extend({
        status: z.enum(leadStatuses).optional(),
        temperature: z.enum(["hot", "warm", "cold"]).optional(),
        search: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ csv: string; filename: string }> => {
    const { requireAdmin, listLeads, leadsToCsv } = await import("./admin.server");
    await requireAdmin(data.accessToken);

    const filters: Parameters<typeof listLeads>[0] = { limit: 5000 };
    if (data.status) filters.status = data.status;
    if (data.temperature) filters.temperature = data.temperature;
    if (data.search) filters.search = data.search;

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
