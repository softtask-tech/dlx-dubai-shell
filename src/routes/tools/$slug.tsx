import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { listAreasWithStats } from "@/data/market";
import { toolBySlug, toolOgPath, TOOLS } from "@/data/tools";
import { faqSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { BestAreas } from "@/components/tools/calculators/best-areas";
import { BuyingCostsCalculator } from "@/components/tools/calculators/buying-costs-calculator";
import { CurrencyConverter } from "@/components/tools/calculators/currency-converter";
import { GoldenVisaChecker } from "@/components/tools/calculators/golden-visa-checker";
import { PaymentPlanCalculator } from "@/components/tools/calculators/payment-plan-calculator";
import { RentVsBuyCalculator } from "@/components/tools/calculators/rent-vs-buy-calculator";
import { YieldCalculator } from "@/components/tools/calculators/yield-calculator";
import { YieldComparison } from "@/components/tools/calculators/yield-comparison";
import { CurrencyPicker } from "@/components/tools/money";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";

export const Route = createFileRoute("/tools/$slug")({
  loader: async ({ params }) => {
    const tool = toolBySlug(params.slug);
    if (!tool) throw notFound();

    /* Only the market-driven tools pay for the query. */
    const areas = tool.usesMarketData ? await listAreasWithStats() : [];
    return { tool, areas };
  },
  head: ({ loaderData }) => {
    const tool = loaderData?.tool;
    if (!tool) return {};

    return pageHead({
      path: `/tools/${tool.slug}`,
      title: tool.title,
      description: tool.description,
      tagline: tool.tagline,
      image: toolOgPath(tool.slug),
      breadcrumbs: [
        { name: "Tools", path: "/tools" },
        { name: tool.name, path: `/tools/${tool.slug}` },
      ],
      schema: [faqSchema(tool.faqs)],
    });
  },
  component: ToolPage,
});

function ToolPage() {
  const { tool, areas } = Route.useLoaderData();
  const others = TOOLS.filter((entry) => entry.slug !== tool.slug).slice(0, 4);

  return (
    <>
      <Section className="pt-44 pb-12 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Calculator</Eyebrow>
              <h1 className="display-1 mt-8">{tool.title}</h1>
              <p className="lead mt-8 max-w-measure text-muted-foreground">{tool.tagline}</p>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <CurrencyPicker />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Layer one of the golden rule: the answer in plain language, before the
          reader meets a single input. It is also what an answer engine quotes. */}
      <Section className="pt-0 pb-14">
        <Reveal>
          <div className="border-t-2 border-accent pt-10 lg:grid lg:grid-cols-12 lg:gap-12">
            <h2 className="eyebrow lg:col-span-3">The short answer</h2>
            <p className="lead mt-6 max-w-measure text-foreground lg:col-span-8 lg:col-start-5 lg:mt-0">
              {tool.answer}
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-0">
        <Reveal>
          <Calculator slug={tool.slug} areas={areas} />
        </Reveal>
      </Section>

      {/* The lead capture sits after the answer, not in front of it. Someone who
          has just seen a number they care about is the right moment to ask. */}
      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>Next step</Eyebrow>
              <h2 className="display-2 mt-6">Put a real property behind it.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                A calculator works with the numbers you give it. We work with the building, the
                seller and the service charge schedule — which is where the answer usually changes.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="calculator"
                sourceDetail={`tool-${tool.slug}`}
                defaultIntent={tool.intent}
                title="Ask a consultant"
                description="Tell us what you are working out and we will come back with the real figures."
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Answer-shaped content matching the FAQ schema */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="display-3 mt-6">Asked and answered</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {tool.faqs.map((faq) => (
              <Reveal key={faq.question} className="border-t border-border last:border-b">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                    <h3 className="lead transition-colors group-open:text-accent">
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="eyebrow shrink-0 transition-transform duration-base ease-editorial group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="body-text max-w-measure pb-8 text-muted-foreground">{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <Reveal>
          <Eyebrow>Other tools</Eyebrow>
        </Reveal>
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {others.map((other, index) => (
            <Reveal key={other.slug} delay={stagger(index)} className="bg-secondary">
              <Link
                to="/tools/$slug"
                params={{ slug: other.slug }}
                className="group flex h-full flex-col justify-between gap-8 p-8 transition-colors hover:bg-background"
              >
                <span className="display-3">{other.name}</span>
                <span className="caption">{other.question}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}

/** Dispatches to the calculator for this slug. */
function Calculator({
  slug,
  areas,
}: {
  slug: string;
  areas: Awaited<ReturnType<typeof listAreasWithStats>>;
}) {
  switch (slug) {
    case "rental-yield":
      return <YieldCalculator areas={areas} />;
    case "buying-costs":
      return <BuyingCostsCalculator />;
    case "rent-vs-buy":
      return <RentVsBuyCalculator />;
    case "golden-visa-eligibility":
      return <GoldenVisaChecker />;
    case "yield-comparison":
      return <YieldComparison areas={areas} />;
    case "best-areas":
      return <BestAreas areas={areas} />;
    case "payment-plan":
      return <PaymentPlanCalculator />;
    case "currency-converter":
      return <CurrencyConverter />;
    default:
      return null;
  }
}
