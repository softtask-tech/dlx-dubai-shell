import { createFileRoute, Link } from "@tanstack/react-router";

import { TOOL_CATEGORIES, TOOLS } from "@/data/tools";
import { faqSchema } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { CurrencyPicker } from "@/components/tools/money";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/tools/")({
  head: () =>
    withHeroPreload(
      "downtown-night-monochrome",
      pageHead({
        path: "/tools",
        breadcrumbs: [{ name: "Tools", path: "/tools" }],
        /* The hub answers eight questions before a visitor opens anything. The
         * schema carries the same pairs the cards show, so what a crawler reads
         * and what a reader sees are one and the same. */
        schema: [
          faqSchema(TOOLS.map((tool) => ({ question: tool.question, answer: tool.answer }))),
        ],
      }),
    ),
  component: ToolsIndex,
});

function ToolsIndex() {
  return (
    <>
      <PageHero
        photo="downtown-night-monochrome"
        title="Run the numbers."
        lead="Eight tools that answer the questions people actually ask before buying in Dubai. Every assumption is shown, and every figure you can change, you can change."
      >
        <CurrencyPicker className="mt-8" />
      </PageHero>

      {/*
       * One register, the categories inside it.
       *
       * This rendered a Section per category, each with its own eyebrow, all
       * carrying `pt-0` through a ternary whose two branches were the same
       * string. The sections were already flowing into one another, so they
       * were shells doing nothing but repeating a shape, which is the fault
       * the services page had in a louder form.
       *
       * The categories stay, because which question a tool answers is real
       * information. They are headings in one continuous list now, marked by a
       * rule rather than announced by a label above a section boundary.
       */}
      <Section className="pt-0">
      {TOOL_CATEGORIES.map((category) => {
        const tools = TOOLS.filter((tool) => tool.category === category);
        if (tools.length === 0) return null;

        return (
          <div key={category} className="pt-16 first:pt-0">
            <Reveal>
              <span aria-hidden className="block h-px w-10 bg-gold-ink" />
              <h2 className="eyebrow mt-5">{category}</h2>
            </Reveal>
            <div className="mt-8">
              <div className="hairline" />
              {tools.map((tool, index) => (
                <Reveal key={tool.slug} delay={stagger(index)}>
                  <Link
                    to="/tools/$slug"
                    params={{ slug: tool.slug }}
                    className="group grid gap-5 border-b border-border py-10 transition-colors hover:border-accent lg:grid-cols-12"
                  >
                    <div className="lg:col-span-4">
                      <h2 className="display-3 transition-colors group-hover:text-accent">
                        {tool.name}
                      </h2>
                      <p className="caption mt-4 text-muted-foreground">{tool.question}</p>
                    </div>

                    <p className="body-text text-muted-foreground lg:col-span-5 lg:col-start-6">
                      {tool.answer}
                    </p>

                    <div className="flex flex-wrap items-start gap-2 lg:col-span-2 lg:col-start-11 lg:justify-end">
                      {tool.usesMarketData ? <Tag variant="soft">Uses DLD data</Tag> : null}
                      {tool.needsVerificationNote ? (
                        <Tag variant="bare">Verify with authorities</Tag>
                      ) : null}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}
      </Section>

      <TrustStrip className="pt-0" />
    </>
  );
}
