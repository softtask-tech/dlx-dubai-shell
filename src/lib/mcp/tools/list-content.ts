import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { GUIDES } from "@/data/guides";
import { SERVICES } from "@/data/services";

export default defineTool({
  name: "list_content",
  title: "List guides and services",
  description:
    "The DLX guide library and service catalogue, as short summaries. Use it to find a slug for get_guide or to answer what DLX Properties does.",
  inputSchema: {
    kind: z
      .enum(["guides", "services", "both"])
      .optional()
      .describe("Which catalogue to return (default both)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ kind }) => {
    const want = kind ?? "both";
    const guides =
      want === "services"
        ? undefined
        : GUIDES.map((guide) => ({
            slug: guide.slug,
            title: guide.title,
            category: guide.category,
            tagline: guide.tagline,
            answer: guide.answer,
            reading_minutes: guide.readingMinutes,
            reviewed_on: guide.reviewedOn,
          }));
    const services =
      want === "guides"
        ? undefined
        : SERVICES.map((service) => ({
            slug: service.slug,
            name: service.name,
            title: service.title,
            tagline: service.tagline,
            description: service.description,
            audience: service.audience,
          }));

    const payload = {
      ...(guides ? { guides } : {}),
      ...(services ? { services } : {}),
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
