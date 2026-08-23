import { createFileRoute } from "@tanstack/react-router";

import { listPartnerDevelopers } from "@/data/catalogue";
import { listTestimonials } from "@/data/people";
import { LocalisedAbout } from "@/components/pages/localised-pages";
import { localisedHead } from "@/lib/localised-seo";

export const Route = createFileRoute("/$lang/about")({
  loader: async () => {
    const [testimonials, partners] = await Promise.all([
      listTestimonials(3),
      listPartnerDevelopers(),
    ]);
    return { testimonials, partners };
  },
  head: ({ params }) => localisedHead(params.lang, "/about"),
  component: Page,
});

function Page() {
  const { testimonials, partners } = Route.useLoaderData();
  return <LocalisedAbout testimonials={testimonials} partners={partners} />;
}
