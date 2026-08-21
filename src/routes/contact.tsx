import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => pageHead({ path: "/contact", breadcrumbs: [{ name: "Contact", path: "/contact" }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageIntro
      eyebrow="Enquiries"
      title="Contact"
      description="A discreet, no-obligation conversation. Enquiry details will live here."
    />
  );
}
