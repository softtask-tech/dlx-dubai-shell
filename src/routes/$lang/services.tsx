import { createFileRoute } from "@tanstack/react-router";

import { LocalisedServices } from "@/components/pages/localised-pages";
import { localisedHead } from "@/lib/localised-seo";

export const Route = createFileRoute("/$lang/services")({
  head: ({ params }) => localisedHead(params.lang, "/services"),
  component: LocalisedServices,
});
