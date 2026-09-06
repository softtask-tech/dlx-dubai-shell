import { createFileRoute } from "@tanstack/react-router";

import { OffPlanIndex } from "@/components/commercial/off-plan-index";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/off-plan/")({
  loader: () => ({ projects: OFF_PLAN_PROJECTS }),
  head: () =>
    pageHead({
      path: "/off-plan",
      title: "Off-plan property: Azizi Florence and Sobha City",
      description:
        "The two off-plan communities DLX Properties is representing now — Azizi Florence in Sharjah and Sobha City in Abu Dhabi — with the developer's own figures, homes, amenities and what to weigh before you commit.",
      tagline: "Off-plan decisions built from terms, timing and evidence.",
      image: "/og/off-plan.png",
      breadcrumbs: [{ name: "Off-plan", path: "/off-plan" }],
    }),
  component: OffPlanRoute,
});

function OffPlanRoute() {
  return <OffPlanIndex projects={Route.useLoaderData().projects} />;
}
