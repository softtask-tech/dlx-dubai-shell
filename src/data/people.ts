/** Consultants and client testimonials. */
import { db } from "./database";
import { withFallback } from "./resilience";
import type { Agent, Testimonial } from "./types";

export async function listAgents(): Promise<Agent[]> {
  return withFallback(() => runListAgents(), [], "listAgents");
}

async function runListAgents(): Promise<Agent[]> {
  const { data, error } = await db
    .from("agents")
    .select("*")
    .order("display_order")
    .order("full_name")
    .returns<Agent[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getAgent(slug: string): Promise<Agent | null> {
  const { data, error } = await db.from("agents").select("*").eq("slug", slug).maybeSingle<Agent>();
  if (error) throw error;
  return data;
}

export async function listTestimonials(limit?: number): Promise<Testimonial[]> {
  return withFallback(() => runListTestimonials(limit), [], "listTestimonials");
}

async function runListTestimonials(limit?: number): Promise<Testimonial[]> {
  let query = db.from("testimonials").select("*").order("display_order");
  if (limit) query = query.limit(limit);
  const { data, error } = await query.returns<Testimonial[]>();
  if (error) throw error;
  return data ?? [];
}
