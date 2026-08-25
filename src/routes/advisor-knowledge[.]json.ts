import { createFileRoute } from "@tanstack/react-router";

import { buildKnowledgeIndex } from "@/data/knowledge";

/**
 * /advisor-knowledge.json, the advisor's knowledge source, as data.
 *
 * Phase 5 gives the chat and the voice agent one brain; this is what that brain
 * reads. Serving it over HTTP rather than importing it means the voice layer,
 * which runs outside this app, retrieves from exactly the same index the chat
 * does, including the guardrails, which travel with the entries rather than
 * being restated in two prompts that will eventually disagree.
 *
 * Everything here is already public: it is the copy on the site, plus the market
 * figures the site already shows, each with the attribution it already carries.
 * Nothing is exposed that a reader could not read.
 */
export const Route = createFileRoute("/advisor-knowledge.json")({
  server: {
    handlers: {
      GET: async () => {
        const index = await buildKnowledgeIndex();

        return new Response(JSON.stringify(index, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            /* Content changes when someone publishes, not by the minute. */
            "cache-control": "public, max-age=900, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
