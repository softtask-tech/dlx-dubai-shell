import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "Guides — DLX Properties Dubai";
const DESCRIPTION =
  "Practical guides to buying, owning and relocating to Dubai, written for international clients.";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
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
