import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/properties")({
  head: () =>
    pageHead({ path: "/properties", breadcrumbs: [{ name: "Properties", path: "/properties" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  return (
    <PageIntro
      eyebrow="Portfolio"
      title="Properties"
      description="A curated selection of prime and off-market residences across Dubai. The portfolio is being prepared."
    />
  );
}
