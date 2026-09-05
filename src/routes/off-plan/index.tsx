import { createFileRoute } from "@tanstack/react-router";

import { OffPlanIndex } from "@/components/commercial/off-plan-index";
import { getDemoProjectAccessFn } from "@/data/demo-access.functions";
import { DEMO_OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/off-plan/")({
  loader: async () => {
    const demoEnabled = await getDemoProjectAccessFn();
    return { demoEnabled, projects: demoEnabled ? DEMO_OFF_PLAN_PROJECTS : [] };
  },
  head: ({ loaderData }) =>
    pageHead({
      path: "/off-plan",
      noIndex: loaderData?.demoEnabled ?? false,
      title: "Off-plan property in Dubai",
      description:
        "A considered route into Dubai off-plan property, separating verified availability, payment terms, delivery and market evidence from sales narrative.",
      tagline: "Off-plan decisions built from terms, timing and evidence.",
      image: "/og/properties.png",
    }),
  component: OffPlanRoute,
});

function OffPlanRoute() {
  return <OffPlanIndex projects={Route.useLoaderData().projects} />;
}
