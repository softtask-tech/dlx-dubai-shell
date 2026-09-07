import { createFileRoute } from "@tanstack/react-router";

import { listTestimonials, listAgents } from "@/data/people";
import { advisorAvailabilityFn } from "@/data/advisor.functions";
import { getMarketMetadataFn, getMarketOverviewFn } from "@/data/market-public.functions";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { HomePage } from "@/components/pages/home-page";
import { localisedHead } from "@/lib/localised-seo";

/**
 * The homepage, in a language other than English.
 *
 * It renders the same component the English route does, and that is the whole
 * point of this file. There used to be a second implementation, `LocalisedHome`,
 * built from an older set of primitives: a different hero photograph, no
 * advisor panel, no market glance, no off-plan section, no team cards. So
 * changing language did not change the language of a page, it changed the page.
 * A reader switching to Arabic arrived somewhere that merely belonged to the
 * same company, and every improvement made to the English homepage silently
 * skipped four locales.
 *
 * One component now, so the design cannot drift again. Direction, fonts and the
 * navigation still come from the locale: `dir="rtl"` is set on the document by
 * the root shell, the Arabic and Devanagari faces are loaded by the `$lang`
 * layout, and every layout property in the shared page is logical
 * (`start`/`end`, `ps`/`pe`) rather than left/right, so the same markup lays
 * itself out correctly in both directions.
 *
 * The page copy is still English. That is a real gap and it is deliberate
 * rather than hidden: translating this site's claims is work for a person, not
 * something to generate, because the copy makes specific statements about a
 * regulator and an official data licence and a mistranslation there is not a
 * typo. The structure is shared now, so the translations can land into it
 * without another redesign.
 */
export const Route = createFileRoute("/$lang/")({
  loader: async () => {
    const [testimonials, agents, availability, metadata, quarterly] = await Promise.all([
      listTestimonials(3),
      listAgents(),
      advisorAvailabilityFn(),
      getMarketMetadataFn(),
      getMarketOverviewFn({
        data: {
          metrics: [
            "registered_sale_count",
            "registered_rental_contract_count",
            "median_registered_annual_rent_aed",
          ],
          grain: "quarter",
          from: "2022-01-01",
          to: "2026-12-31",
          limit: 200,
        },
      }),
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
  head: ({ params }) => localisedHead(params.lang, "/"),
  component: Page,
});

function Page() {
  return <HomePage {...Route.useLoaderData()} />;
}
