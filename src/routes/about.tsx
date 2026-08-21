import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => pageHead({ path: "/about", breadcrumbs: [{ name: "About", path: "/about" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageIntro
      eyebrow="The house"
      title="About DLX"
      description="A private Dubai brokerage built on restraint, discretion and relationships measured in decades."
    />
  );
}
