import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "About — DLX Properties Dubai";
const DESCRIPTION =
  "DLX Properties is a private Dubai brokerage built on restraint, discretion and long-term client relationships.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
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
