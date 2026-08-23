import { createFileRoute } from "@tanstack/react-router";

import { LocalisedTools } from "@/components/pages/localised-pages";
import { localisedHead } from "@/lib/localised-seo";

export const Route = createFileRoute("/$lang/tools")({
  head: ({ params }) => localisedHead(params.lang, "/tools"),
  component: LocalisedTools,
});
