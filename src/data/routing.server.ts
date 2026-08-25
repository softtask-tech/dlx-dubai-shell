/**
 * Getting a lead to a person.
 *
 * The single largest determinant of whether paid traffic converts is how long
 * someone waits for a reply, not the ad, not the landing page, not the form.
 * A lead answered in five minutes and the same lead answered in an hour are
 * different businesses. So routing happens inside the submission, not in a
 * nightly sweep, and the moment it happened is stamped on the row so the gap
 * can be measured rather than assumed.
 *
 * WHO GETS IT. Round-robin among consultants who are published and take leads,
 * weighted by nothing at all. Sophisticated allocation, by specialism, by
 * community, by past conversion, needs data this brokerage does not have yet,
 * and a clever rule built on guesses distributes leads worse than a fair queue.
 *
 * WHO DOES NOT. Cold leads are not assigned. Handing a consultant a queue of
 * enquiries that will not convert teaches them to ignore the queue, which
 * costs the hot ones. Cold is held for nurture and surfaces when it warms up.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { LeadTemperature } from "./types";
import type { PaidMediaDatabase } from "./paid-media-types";

export type RoutingResult = {
  assignedAgentId: string | null;
  reason: string;
  routed: boolean;
};

/**
 * Chooses the consultant who was assigned least recently.
 *
 * A fair queue rather than a random pick: random distributes unevenly over
 * small numbers, and with a team of six that is the difference between an even
 * split and one person getting a third of everything.
 */
async function nextAgent(
  supabase: SupabaseClient<PaidMediaDatabase>,
): Promise<{ id: string; name: string } | null> {
  const admin = await adminDb();

  const { data: agents, error } = await admin
    .from("agents")
    .select("id, full_name")
    /* `is_active` is the agents table's own flag for "takes work". */
    .eq("is_active", true)
    .order("display_order");

  if (error || !agents || agents.length === 0) return null;

  /* Their most recent assignment, so the queue is by wait rather than by list
   * position. An agent who has never been assigned sorts first, which is what
   * should happen to someone who has just joined. */
  const { data: recent } = await supabase
    .from("leads")
    .select("assigned_agent_id, routed_at")
    .not("assigned_agent_id", "is", null)
    .order("routed_at", { ascending: false })
    .limit(200);

  const lastAssigned = new Map<string, string>();
  for (const row of (recent ?? []) as Array<Record<string, unknown>>) {
    const agentId = row["assigned_agent_id"];
    const routedAt = row["routed_at"];
    if (typeof agentId === "string" && typeof routedAt === "string" && !lastAssigned.has(agentId)) {
      lastAssigned.set(agentId, routedAt);
    }
  }

  const sorted = [...agents].sort((a, b) => {
    const left = lastAssigned.get(a.id) ?? "";
    const right = lastAssigned.get(b.id) ?? "";
    return left.localeCompare(right);
  });

  const chosen = sorted[0];
  return chosen ? { id: chosen.id, name: chosen.full_name } : null;
}

/**
 * Routes a lead, or deliberately does not.
 *
 * Never throws: a routing failure must leave the lead saved and unassigned in
 * the inbox, where a human will see it, rather than taking down the submission.
 */
export async function routeLead(input: {
  leadId: string;
  temperature: LeadTemperature;
  score: number;
}): Promise<RoutingResult> {
  const supabase = (await adminDb()) as unknown as SupabaseClient<PaidMediaDatabase>;

  if (input.temperature === "cold") {
    const reason = `Held for nurture, scored ${input.score}`;
    await supabase
      .from("leads")
      .update({ routing_reason: reason, nurture_started_at: new Date().toISOString() } as never)
      .eq("id", input.leadId)
      .then(undefined, (error: unknown) =>
        console.error("[routing] could not mark nurture", error),
      );

    return { assignedAgentId: null, reason, routed: false };
  }

  try {
    const agent = await nextAgent(supabase);
    if (!agent) {
      const reason = "No consultant available to assign";
      await supabase
        .from("leads")
        .update({ routing_reason: reason } as never)
        .eq("id", input.leadId);
      return { assignedAgentId: null, reason, routed: false };
    }

    const reason = `${input.temperature === "hot" ? "Hot" : "Warm"} (${input.score}), assigned to ${agent.name}`;

    const { error } = await supabase
      .from("leads")
      .update({
        assigned_agent_id: agent.id,
        routed_at: new Date().toISOString(),
        routing_reason: reason,
      } as never)
      .eq("id", input.leadId);

    if (error) throw new Error(error.message);

    return { assignedAgentId: agent.id, reason, routed: true };
  } catch (error) {
    console.error("[routing] could not route the lead", error);
    return {
      assignedAgentId: null,
      reason: "Routing failed, waiting in the inbox",
      routed: false,
    };
  }
}
