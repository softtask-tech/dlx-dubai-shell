import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/market-intelligence")({
  head: () =>
    pageHead({
      path: "/market-intelligence",
      breadcrumbs: [{ name: "Market Intelligence", path: "/market-intelligence" }],
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
