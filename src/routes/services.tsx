import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "Services — DLX Properties Dubai";
const DESCRIPTION =
  "Acquisition, disposal, leasing and portfolio advisory for private owners and family offices in Dubai.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PageIntro
      eyebrow="What we do"
      title="Services"
      description="Acquisition, disposal, leasing and long-term portfolio advisory. Detail to follow."
    />
  );
}
