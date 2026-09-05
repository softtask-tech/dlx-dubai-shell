/**
 * The DLX Properties MCP server.
 *
 * Public and unauthenticated by explicit choice: every tool reads only what the
 * website already publishes — published listings, Dubai Land Department market
 * figures, the guide library and the service catalogue. All queries go through
 * the publishable key, so row-level security applies as `anon` and nothing
 * unpublished, and no lead or admin data, is reachable here.
 */
import { defineMcp } from "@lovable.dev/mcp-js";
import type { McpDefinitionInput } from "@lovable.dev/mcp-js";

import getGuide from "./tools/get-guide";
import getProperty from "./tools/get-property";
import listContent from "./tools/list-content";
import listProperties from "./tools/list-properties";
import marketOverview from "./tools/market-overview";

export default defineMcp({
  name: "dlx-dubai-shell",
  title: "DLX Dubai Shell",
  version: "1.0.0",
  instructions:
    "Tools for DLX Properties, a Dubai real estate brokerage. Use `list_properties` and `get_property` for the published portfolio, `market_overview` for Dubai Land Department market figures, and `list_content` / `get_guide` for the buyer guides and services. Only published, public information is available. Cite the Dubai Land Department when quoting market figures, and never invent prices, availability or legal, visa or tax specifics — route those to a DLX consultant.",
  /* The definitions are structurally correct; the cast only satisfies
   * exactOptionalPropertyTypes, which reads an absent `outputSchema` as a
   * mismatch. */
  tools: [
    listProperties,
    getProperty,
    marketOverview,
    listContent,
    getGuide,
  ] as unknown as McpDefinitionInput["tools"],
});
