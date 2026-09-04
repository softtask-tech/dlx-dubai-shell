import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getMarketSummary, listAreasWithStats, listRecentTransactions } from "@/data/market";

export default defineTool({
  name: "market_overview",
  title: "Dubai market overview",
  description:
    "Dubai market figures from DLX's cleaned Dubai Land Department data: city-wide summary, per-community price and yield statistics, and recent transactions. Always cite the Dubai Land Department as the source.",
  inputSchema: {
    include_areas: z.boolean().optional().describe("Include per-community statistics (default true)."),
    include_transactions: z
      .boolean()
      .optional()
      .describe("Include the most recent transactions (default false)."),
    transaction_limit: z.number().optional().describe("How many transactions to include (max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const summary = await getMarketSummary();

    const areas =
      input.include_areas === false
        ? undefined
        : (await listAreasWithStats()).map((area) => ({
            slug: area.slug,
            name: area.name,
            stats: area.stats,
          }));

    const limit = Math.min(Math.max(Math.trunc(input.transaction_limit ?? 12), 1), 50);
    const transactions = input.include_transactions ? await listRecentTransactions(limit) : undefined;

    const payload = {
      summary,
      source: "Dubai Land Department (via DLX Properties' cleaned dataset)",
      ...(areas ? { areas } : {}),
      ...(transactions ? { recent_transactions: transactions } : {}),
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
