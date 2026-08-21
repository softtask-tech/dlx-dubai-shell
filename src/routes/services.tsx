import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  head: () =>
    pageHead({ path: "/services", breadcrumbs: [{ name: "Services", path: "/services" }] }),
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
