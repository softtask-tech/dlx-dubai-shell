import { createFileRoute } from "@tanstack/react-router";

import { listTestimonials, listAgents } from "@/data/people";
import { advisorAvailabilityFn } from "@/data/advisor.functions";
import { getMarketMetadataFn, getMarketOverviewFn } from "@/data/market-public.functions";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { HOME_FAQ } from "@/data/home-faq";
import { faqSchema, reviewSchemaFor } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { retrying, tolerant } from "@/lib/resilient";

import { HomePage, HERO_PHOTO } from "@/components/pages/home-page";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [testimonials, agents, availability, metadata, quarterly] = await Promise.all([
      tolerant(() => listTestimonials(3), [], "home testimonials"),
      tolerant(() => listAgents(), [], "home agents"),
      /* Asked for here rather than read off the root's loader: it is two env
       * checks, and a page that reaches across routes for its data breaks the
       * moment either route's shape changes. */
      tolerant(
        () => advisorAvailabilityFn(),
        { chat: false, voice: false, agentId: null },
        "advisor availability",
      ),

      retrying(() => getMarketMetadataFn(), "market metadata"),
      tolerant(
        () =>
          getMarketOverviewFn({
            data: {
              metrics: [
                "registered_sale_count",
                "registered_rental_contract_count",
                "median_registered_annual_rent_aed",
              ],
              grain: "quarter",
              /* The glance shows the latest figures and a short series, not the
               * whole record. Asking for every quarter since 2019 was costing the
               * homepage its time to first byte for rows it then threw away; the
               * full history lives on Market Intelligence, which is the page that
               * actually draws it. */
              from: "2022-01-01",
              to: "2026-12-31",
              limit: 200,
            },
          }),
        [],
        "home market overview",
      ),
    ]);


    return {
      testimonials,
      agents,
      availability,
      metadata,
      quarterly,
      offPlanProjects: OFF_PLAN_PROJECTS,
    };
  },
  /* Review schema is built from the rows the loader actually returned, so a
   * page with no verified reviews emits no Review nodes at all. */
  head: ({ loaderData }) =>
    withHeroPreload(
      HERO_PHOTO,
      pageHead({
        path: "/",
        schema: [faqSchema(HOME_FAQ), ...reviewSchemaFor(loaderData?.testimonials ?? [])],
      }),
    ),
  component: Index,
});


function Index() {
  return <HomePage {...Route.useLoaderData()} />;
}
