import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/page-intro";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/tools")({
  head: () => pageHead({ path: "/tools", breadcrumbs: [{ name: "Tools", path: "/tools" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <PageIntro
      eyebrow="Calculators"
      title="Tools"
      description="Mortgage, yield, purchase costs and Golden Visa eligibility — the numbers worth knowing before you commit. The calculators are being built."
    />
  );
}
