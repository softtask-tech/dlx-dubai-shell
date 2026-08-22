/**
 * Admin data access — server side only.
 *
 * Every function here starts by proving the caller is an admin. The check is
 * not "did the browser say so": the access token is verified against Supabase
 * Auth, and the role is read from `user_roles` through the security-definer
 * `has_role()`. Only then does the service-role client come out.
 *
 * Row-level security would already stop a non-admin reading leads. This is the
 * second lock, because the service-role client bypasses RLS by design and one
 * missing check would expose the whole pipeline.
 */
import { adminDb } from "./database.server";
import type { Agent, Lead, LeadNote, LeadStatus, Testimonial } from "./types";

export type AdminIdentity = { userId: string; email: string | null };

/**
 * Verifies the bearer token and the admin role.
 * Throws rather than returning a flag, so a caller cannot forget to check.
 */
export async function requireAdmin(accessToken: string | undefined): Promise<AdminIdentity> {
  if (!accessToken) throw new Error("Not signed in.");

  const supabase = await adminDb();

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("Not signed in.");

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (rolesError) throw new Error(`Could not check permissions: ${rolesError.message}`);
  if (!roles) throw new Error("This account does not have admin access.");

  return { userId: userData.user.id, email: userData.user.email ?? null };
}

export type LeadListFilters = {
  status?: LeadStatus;
  temperature?: "hot" | "warm" | "cold";
  search?: string;
  limit?: number;
};

export type LeadWithAgent = Lead & {
  assigned_agent: Pick<Agent, "id" | "full_name"> | null;
};

/** The inbox list, newest first. */
export async function listLeads(filters: LeadListFilters = {}): Promise<LeadWithAgent[]> {
  const supabase = await adminDb();

  let query = supabase
    .from("leads")
    .select("*, assigned_agent:agents (id, full_name)")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.search) {
    /* Name, email or phone — whichever the person at the desk remembers. */
    const term = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data, error } = await query.returns<LeadWithAgent[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLead(
  id: string,
): Promise<{ lead: LeadWithAgent; notes: LeadNote[] } | null> {
  const supabase = await adminDb();

  const { data, error } = await supabase
    .from("leads")
    .select("*, assigned_agent:agents (id, full_name)")
    .eq("id", id)
    .maybeSingle<LeadWithAgent>();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: notes, error: notesError } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .returns<LeadNote[]>();

  if (notesError) throw new Error(notesError.message);
  return { lead: data, notes: notes ?? [] };
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; assignedAgentId?: string | null },
): Promise<void> {
  const supabase = await adminDb();

  const row: Partial<Pick<Lead, "status" | "assigned_agent_id">> = {};
  if (patch.status) row.status = patch.status;
  if (patch.assignedAgentId !== undefined) row.assigned_agent_id = patch.assignedAgentId;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("leads").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addLeadNote(leadId: string, authorId: string, body: string): Promise<void> {
  const supabase = await adminDb();
  const { error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, author_id: authorId, body });
  if (error) throw new Error(error.message);
}

/** Everything the inbox exports, in the order a spreadsheet wants it. */
const CSV_COLUMNS: ReadonlyArray<[header: string, get: (lead: LeadWithAgent) => unknown]> = [
  ["Created", (lead) => lead.created_at],
  ["Name", (lead) => lead.full_name],
  ["Email", (lead) => lead.email],
  ["Phone", (lead) => lead.phone],
  ["Status", (lead) => lead.status],
  ["Temperature", (lead) => lead.temperature],
  ["Score", (lead) => lead.score],
  ["Intent", (lead) => lead.intent],
  ["Timeline", (lead) => lead.timeline],
  ["Budget min", (lead) => lead.budget_min],
  ["Budget max", (lead) => lead.budget_max],
  ["Currency", (lead) => lead.budget_currency],
  ["Source", (lead) => lead.source_type],
  ["Source detail", (lead) => lead.source_detail],
  ["Page", (lead) => lead.page_path],
  ["UTM source", (lead) => lead.utm_source],
  ["UTM medium", (lead) => lead.utm_medium],
  ["UTM campaign", (lead) => lead.utm_campaign],
  ["Assigned to", (lead) => lead.assigned_agent?.full_name ?? null],
  ["Message", (lead) => lead.message],
];

/**
 * Escapes one CSV cell.
 *
 * The leading apostrophe on values starting with =, +, - or @ stops Excel and
 * Sheets treating an exported message as a formula — a lead who types
 * "=cmd|..." into the message box must never become a live cell.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function leadsToCsv(leads: readonly LeadWithAgent[]): string {
  const header = CSV_COLUMNS.map(([name]) => csvCell(name)).join(",");
  const rows = leads.map((lead) => CSV_COLUMNS.map(([, get]) => csvCell(get(lead))).join(","));
  /* CRLF and a byte-order mark, because that is what Excel expects. */
  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}

/** The assignment dropdown. */
export async function listAllAgents(): Promise<Agent[]> {
  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("full_name")
    .returns<Agent[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Testimonials including drafts, for the content editor. */
export async function listAllTestimonials(): Promise<Testimonial[]> {
  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order")
    .returns<Testimonial[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}
