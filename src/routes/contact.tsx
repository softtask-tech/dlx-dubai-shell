import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "Contact — DLX Properties Dubai";
const DESCRIPTION =
  "Speak privately with DLX Properties about acquiring, selling or advising on Dubai real estate.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
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
