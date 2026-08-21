import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "Properties — DLX Properties Dubai";
const DESCRIPTION =
  "A curated portfolio of prime and off-market Dubai residences, represented privately by DLX Properties.";

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
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
