import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getProperty } from "@/data/properties";

export default defineTool({
  name: "get_property",
  title: "Get property",
  description:
    "Full detail for one published DLX listing: price, size, amenities, DLD permit number and the consultant handling it.",
  inputSchema: { slug: z.string().describe('Listing slug, e.g. "marina-gate-2-bed".') },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const property = await getProperty(slug);
    if (!property) throw new ToolError(`No published listing found for "${slug}".`);
    return {
      content: [{ type: "text", text: JSON.stringify(property, null, 2) }],
      structuredContent: { property },
    };
  },
});
