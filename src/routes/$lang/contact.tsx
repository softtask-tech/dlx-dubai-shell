import { createFileRoute } from "@tanstack/react-router";

import { LocalisedContact } from "@/components/pages/localised-pages";
import { localisedHead } from "@/lib/localised-seo";

export const Route = createFileRoute("/$lang/contact")({
  head: ({ params }) => localisedHead(params.lang, "/contact"),
  component: LocalisedContact,
});
