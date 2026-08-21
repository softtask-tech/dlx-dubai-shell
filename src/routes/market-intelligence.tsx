import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";

const TITLE = "Market Intelligence — DLX Properties Dubai";
const DESCRIPTION =
  "Data, transaction analysis and considered commentary on the Dubai prime residential market.";

export const Route = createFileRoute("/market-intelligence")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MarketIntelligencePage,
});

function MarketIntelligencePage() {
  return (
    <PageIntro
      eyebrow="Research"
      title="Market Intelligence"
      description="Transaction data, district analysis and quiet commentary on where Dubai value is moving."
    />
  );
}
