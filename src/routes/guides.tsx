import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/guides")({
  head: () => pageHead({ path: "/guides", breadcrumbs: [{ name: "Guides", path: "/guides" }] }),
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <PageIntro
      eyebrow="Knowledge"
      title="Guides"
      description="Buying, owning and relocating to Dubai — explained plainly for international clients."
    />
  );
}
