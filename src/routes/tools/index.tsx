import { createFileRoute, Link } from "@tanstack/react-router";

import { TOOL_CATEGORIES, TOOLS } from "@/data/tools";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { CurrencyPicker } from "@/components/tools/money";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/tools/")({
  head: () => pageHead({ path: "/tools", breadcrumbs: [{ name: "Tools", path: "/tools" }] }),
  component: ToolsIndex,
});

function ToolsIndex() {
  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Calculators</Eyebrow>
              <h1 className="display-1 mt-8">Run the numbers</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Eight tools that answer the questions people actually ask before buying in Dubai.
                Every assumption is shown, and every figure you can change, you can change.
              </p>
              <CurrencyPicker className="mt-10" />
            </Reveal>
          </div>
        </div>
      </Section>

      {TOOL_CATEGORIES.map((category, categoryIndex) => {
        const tools = TOOLS.filter((tool) => tool.category === category);
        if (tools.length === 0) return null;

        return (
          <Section key={category} className={categoryIndex === 0 ? "pt-0" : "pt-0"}>
            <Reveal>
              <Eyebrow>{category}</Eyebrow>
            </Reveal>
            <div className="mt-8 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, index) => (
                <Reveal key={tool.slug} delay={stagger(index)} className="bg-background">
                  <Link
                    to="/tools/$slug"
                    params={{ slug: tool.slug }}
                    className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-secondary"
                  >
                    <div>
                      <h2 className="display-3 transition-colors group-hover:text-accent">
                        {tool.name}
                      </h2>
                      <p className="body-text mt-4 text-muted-foreground">{tool.question}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tool.usesMarketData ? <Tag variant="soft">Uses DLD data</Tag> : null}
                      {tool.needsVerificationNote ? (
                        <Tag variant="bare">Verify with authorities</Tag>
                      ) : null}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Section>
        );
      })}

      <TrustStrip className="pt-0" />
    </>
  );
}
