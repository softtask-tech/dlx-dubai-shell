import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { GUIDES, guideBySlug } from "@/data/guides";

export default defineTool({
  name: "get_guide",
  title: "Get guide",
  description:
    "The full text of one DLX buyer guide (buying, selling, investment, Golden Visa, relocation, legal and tax, area guides), including its FAQs.",
  inputSchema: { slug: z.string().describe('Guide slug, e.g. "golden-visa-guide".') },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const guide = guideBySlug(slug);
    if (!guide) {
      const available = GUIDES.map((g) => g.slug).join(", ");
      throw new ToolError(`No guide called "${slug}". Available guides: ${available}.`);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(guide, null, 2) }],
      structuredContent: { guide },
    };
  },
});
