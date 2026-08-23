/**
 * What the advertising actually returned.
 *
 * The number every brokerage wants and almost none can produce, because it
 * requires three things to be true at once: the spend has to be imported, the
 * lead has to carry the campaign that produced it, and someone has to have
 * recorded what became of it. Miss any one and the dashboard shows a confident
 * figure that is wrong.
 *
 * So this module is deliberately unwilling to guess. A campaign with leads and
 * no imported spend reports `spend: null`, not zero — because zero divides into
 * an infinite return, and an infinite return is the kind of number that gets a
 * budget doubled. Every row says which of its three inputs it is missing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { PaidMediaDatabase, CampaignSpendRow } from "./paid-media-types";
import type { LeadTemperature } from "./types";

export type CampaignPerformance = {
  /** The campaign as the UTM tags name it. */
  source: string;
  campaign: string;
  spendAed: number | null;
  leads: number;
  /** Leads a consultant judged worth pursuing. */
  qualified: number;
  won: number;
  revenueAed: number;
  /** Null where spend is unknown — never zero, never inferred. */
  costPerLeadAed: number | null;
  costPerQualifiedAed: number | null;
  /** Revenue ÷ spend. Null where either side is unknown. */
  roas: number | null;
  mix: Record<LeadTemperature, number>;
  /** What this row could not compute, in plain words. */
  gaps: string[];
};

export type RoasSummary = {
  from: string;
  to: string;
  totalSpendAed: number | null;
  totalLeads: number;
  totalQualified: number;
  totalWon: number;
  totalRevenueAed: number;
  /** True when no spend has been imported at all. */
  spendMissing: boolean;
  /** Leads with no campaign attached — direct, organic, or attribution lost. */
  unattributedLeads: number;
  campaigns: CampaignPerformance[];
  mix: Record<LeadTemperature, number>;
};

async function paidDb(): Promise<SupabaseClient<PaidMediaDatabase>> {
  return (await adminDb()) as unknown as SupabaseClient<PaidMediaDatabase>;
}

/** "facebook / summer-offplan" — the key both sides of the join agree on. */
function keyOf(source: string | null, campaign: string | null): string {
  return `${(source ?? "direct").toLowerCase()}|${(campaign ?? "—").toLowerCase()}`;
}

export async function campaignPerformance(input: {
  from: string;
  to: string;
}): Promise<RoasSummary> {
  const supabase = await paidDb();

  const [{ data: leadRows, error: leadError }, { data: spendRows, error: spendError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .gte("created_at", input.from)
        .lte("created_at", `${input.to}T23:59:59.999Z`),
      supabase
        .from("campaign_spend")
        .select("*")
        .gte("spend_date", input.from)
        .lte("spend_date", input.to),
    ]);

  if (leadError) throw new Error(leadError.message);
  if (spendError) throw new Error(spendError.message);

  const spendByCampaign = new Map<string, number>();
  for (const row of (spendRows ?? []) as CampaignSpendRow[]) {
    /* Spend is imported against the platform's campaign id or name; leads carry
     * whatever the UTM said. Both are matched on the lowercased name, which is
     * the only thing the two sides reliably share — and why the import screen
     * says to name campaigns the same way in both places. */
    const key = keyOf(row.platform, row.campaign_name ?? row.campaign_id);
    spendByCampaign.set(key, (spendByCampaign.get(key) ?? 0) + Number(row.spend_aed));
  }

  const buckets = new Map<string, CampaignPerformance>();
  const mix: Record<LeadTemperature, number> = { hot: 0, warm: 0, cold: 0 };
  let unattributed = 0;
  let totalRevenue = 0;
  let totalQualified = 0;
  let totalWon = 0;

  for (const raw of (leadRows ?? []) as Array<Record<string, unknown>>) {
    const source = typeof raw["utm_source"] === "string" ? raw["utm_source"] : null;
    const campaign = typeof raw["utm_campaign"] === "string" ? raw["utm_campaign"] : null;
    const status = String(raw["status"] ?? "new");
    const temperature = (raw["temperature"] as LeadTemperature) ?? "cold";
    const dealValue = typeof raw["deal_value_aed"] === "number" ? raw["deal_value_aed"] : 0;

    /* Spam never counts as a lead. Including it would flatter the cost per
     * lead of whichever campaign attracts the most junk — precisely backwards. */
    if (status === "unqualified") continue;

    if (!source && !campaign) unattributed += 1;

    const key = keyOf(source, campaign);
    const bucket = buckets.get(key) ?? {
      source: source ?? "direct",
      campaign: campaign ?? "—",
      spendAed: spendByCampaign.get(key) ?? null,
      leads: 0,
      qualified: 0,
      won: 0,
      revenueAed: 0,
      costPerLeadAed: null,
      costPerQualifiedAed: null,
      roas: null,
      mix: { hot: 0, warm: 0, cold: 0 },
      gaps: [],
    };

    bucket.leads += 1;
    bucket.mix[temperature] += 1;
    mix[temperature] += 1;

    /* "Qualified" means a consultant said so. Everything past qualified in the
     * pipeline counts too — a won deal was obviously qualified first. */
    if (["qualified", "viewing_booked", "negotiating", "won"].includes(status)) {
      bucket.qualified += 1;
      totalQualified += 1;
    }
    if (status === "won") {
      bucket.won += 1;
      bucket.revenueAed += dealValue;
      totalWon += 1;
      totalRevenue += dealValue;
    }

    buckets.set(key, bucket);
  }

  const campaigns = [...buckets.values()].map((bucket) => {
    const gaps: string[] = [];

    if (bucket.spendAed === null) {
      gaps.push("No spend imported for this campaign");
    } else if (bucket.leads > 0) {
      bucket.costPerLeadAed = bucket.spendAed / bucket.leads;
      bucket.costPerQualifiedAed = bucket.qualified > 0 ? bucket.spendAed / bucket.qualified : null;
      if (bucket.qualified === 0) gaps.push("No lead qualified yet");
      if (bucket.spendAed > 0 && bucket.won > 0) bucket.roas = bucket.revenueAed / bucket.spendAed;
    }

    if (bucket.won > 0 && bucket.revenueAed === 0) {
      gaps.push("Deal marked won with no value recorded");
    }
    if (bucket.won === 0 && bucket.spendAed !== null) {
      gaps.push("No closed deal yet — return unknown, not zero");
    }

    bucket.gaps = gaps;
    return bucket;
  });

  /* Most spend first, then most leads. What is costing money leads the page. */
  campaigns.sort((a, b) => (b.spendAed ?? -1) - (a.spendAed ?? -1) || b.leads - a.leads);

  const totalSpend = [...spendByCampaign.values()].reduce((sum, value) => sum + value, 0);

  return {
    from: input.from,
    to: input.to,
    totalSpendAed: spendByCampaign.size > 0 ? totalSpend : null,
    totalLeads: campaigns.reduce((sum, row) => sum + row.leads, 0),
    totalQualified,
    totalWon,
    totalRevenueAed: totalRevenue,
    spendMissing: spendByCampaign.size === 0,
    unattributedLeads: unattributed,
    campaigns,
    mix,
  };
}

/**
 * Imports spend from a pasted CSV.
 *
 * A paste box rather than an API integration, because Meta and Google both
 * require OAuth dances this codebase has no other use for, and every ad manager
 * on earth exports a CSV in about four clicks. Re-importing a day corrects it
 * rather than doubling it.
 *
 * Expected columns, in any order, matched case-insensitively:
 *   platform, campaign, date, spend [, ad, impressions, clicks, conversions]
 */
export async function importSpendCsv(csv: string): Promise<{ imported: number; errors: string[] }> {
  const supabase = await paidDb();
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { imported: 0, errors: ["Nothing to import"] };

  const header = (lines[0] ?? "").split(",").map((cell) => cell.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);

  const platformAt = index("platform");
  const campaignAt = index("campaign");
  const dateAt = index("date");
  const spendAt = index("spend");

  if (platformAt < 0 || campaignAt < 0 || dateAt < 0 || spendAt < 0) {
    return {
      imported: 0,
      errors: ["The header must include platform, campaign, date and spend"],
    };
  }

  const errors: string[] = [];
  const rows: PaidMediaDatabase["public"]["Tables"]["campaign_spend"]["Insert"][] = [];

  for (const [offset, line] of lines.slice(1).entries()) {
    if (!line.trim()) continue;
    const cells = line.split(",").map((cell) => cell.trim());

    const spend = Number(cells[spendAt]?.replace(/[^\d.-]/g, ""));
    const date = cells[dateAt] ?? "";
    const campaign = cells[campaignAt] ?? "";

    if (!campaign || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(spend) || spend < 0) {
      errors.push(`Line ${offset + 2}: needs a campaign, an ISO date and a spend`);
      continue;
    }

    const adAt = index("ad");
    const impressionsAt = index("impressions");
    const clicksAt = index("clicks");
    const conversionsAt = index("conversions");

    rows.push({
      platform: (cells[platformAt] ?? "unknown").toLowerCase(),
      campaign_id: campaign,
      campaign_name: campaign,
      ...(adAt >= 0 && cells[adAt] ? { ad_id: cells[adAt], ad_name: cells[adAt] } : {}),
      spend_date: date,
      spend_aed: spend,
      ...(impressionsAt >= 0 && cells[impressionsAt]
        ? { impressions: Number(cells[impressionsAt]) }
        : {}),
      ...(clicksAt >= 0 && cells[clicksAt] ? { clicks: Number(cells[clicksAt]) } : {}),
      ...(conversionsAt >= 0 && cells[conversionsAt]
        ? { platform_conversions: Number(cells[conversionsAt]) }
        : {}),
    });
  }

  if (rows.length === 0) return { imported: 0, errors };

  const { error } = await supabase
    .from("campaign_spend")
    .upsert(rows as never, { onConflict: "platform,campaign_id,ad_id,spend_date" });

  if (error) errors.push(error.message);

  return { imported: error ? 0 : rows.length, errors };
}
