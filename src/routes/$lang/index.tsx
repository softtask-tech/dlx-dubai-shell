import { createFileRoute } from "@tanstack/react-router";

import { listPartnerDevelopers } from "@/data/catalogue";
import { listProperties } from "@/data/properties";
import { listTestimonials } from "@/data/people";
import { LocalisedHome } from "@/components/pages/localised-home";
import { localisedHead } from "@/lib/localised-seo";

export const Route = createFileRoute("/$lang/")({
  loader: async () => {
    const [featured, testimonials, partners] = await Promise.all([
      listProperties({ limit: 3 }),
      listTestimonials(3),
      listPartnerDevelopers(),
    ]);
    return { featured, testimonials, partners };
  },
  head: ({ params }) => localisedHead(params.lang, "/"),
  component: Page,
});

function Page() {
  const { featured, testimonials, partners } = Route.useLoaderData();
  return <LocalisedHome featured={featured} testimonials={testimonials} partners={partners} />;
}
