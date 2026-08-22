/** Areas, developers and projects — the catalogue behind listings. */
import { db } from "./database";
import { withFallback } from "./resilience";
import type { Area, Developer, Project } from "./types";

export async function listAreas(): Promise<Area[]> {
  return withFallback(() => runListAreas(), [], "listAreas");
}

async function runListAreas(): Promise<Area[]> {
  const { data, error } = await db.from("areas").select("*").order("name").returns<Area[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listDevelopers(): Promise<Developer[]> {
  return withFallback(() => runListDevelopers(), [], "listDevelopers");
}

async function runListDevelopers(): Promise<Developer[]> {
  const { data, error } = await db
    .from("developers")
    .select("*")
    .order("name")
    .returns<Developer[]>();
  if (error) throw error;
  return data ?? [];
}

/** Developers DLX actively represents, for the partnership strip. */
export async function listPartnerDevelopers(): Promise<Developer[]> {
  return withFallback(() => runListPartnerDevelopers(), [], "listPartnerDevelopers");
}

async function runListPartnerDevelopers(): Promise<Developer[]> {
  const { data, error } = await db
    .from("developers")
    .select("*")
    .eq("is_partner", true)
    .order("name")
    .returns<Developer[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getDeveloper(slug: string): Promise<Developer | null> {
  return withFallback(() => runGetDeveloper(slug), null, "getDeveloper");
}

async function runGetDeveloper(slug: string): Promise<Developer | null> {
  const { data, error } = await db
    .from("developers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Developer>();
  if (error) throw error;
  return data;
}

export type ProjectWithRelations = Project & {
  developer: Pick<Developer, "id" | "slug" | "name" | "logo_url"> | null;
  area: Pick<Area, "id" | "slug" | "name"> | null;
};

const PROJECT_SELECT = `
  *,
  developer:developers (id, slug, name, logo_url),
  area:areas (id, slug, name)
`;

export async function listProjects(
  options: { developerId?: string; limit?: number } = {},
): Promise<ProjectWithRelations[]> {
  return withFallback(() => runListProjects(options), [], "listProjects");
}

async function runListProjects(options: {
  developerId?: string;
  limit?: number;
}): Promise<ProjectWithRelations[]> {
  let query = db
    .from("projects")
    .select(PROJECT_SELECT)
    .order("is_featured", { ascending: false })
    .order("handover_year", { ascending: true, nullsFirst: false });

  if (options.developerId) query = query.eq("developer_id", options.developerId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query.returns<ProjectWithRelations[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getProject(slug: string): Promise<ProjectWithRelations | null> {
  return withFallback(() => runGetProject(slug), null, "getProject");
}

async function runGetProject(slug: string): Promise<ProjectWithRelations | null> {
  const { data, error } = await db
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("slug", slug)
    .maybeSingle<ProjectWithRelations>();
  if (error) throw error;
  return data;
}

export async function listDeveloperSlugs(): Promise<string[]> {
  return withFallback(() => runListDeveloperSlugs(), [], "listDeveloperSlugs");
}

async function runListDeveloperSlugs(): Promise<string[]> {
  const { data, error } = await db.from("developers").select("slug").returns<{ slug: string }[]>();
  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}

export async function listProjectSlugs(): Promise<string[]> {
  return withFallback(() => runListProjectSlugs(), [], "listProjectSlugs");
}

async function runListProjectSlugs(): Promise<string[]> {
  const { data, error } = await db.from("projects").select("slug").returns<{ slug: string }[]>();
  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}
