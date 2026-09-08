import type { ReactNode } from "react";

import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * How a data page opens.
 *
 * Every page on this site opened the same way: eyebrow, large serif headline
 * on the left, a grey paragraph, then a photograph. On a project page that is
 * right, because the photograph is the product. On this page it is wrong: a
 * reader arriving from a search for "Dubai price per square foot" met a
 * decorative skyline and had to scroll past it to reach the only thing the
 * page exists to tell them.
 *
 * So a data page opens on its data. The headline still leads, because a page
 * needs a sentence, but the figures sit beside it rather than a screen below,
 * and the photograph is gone rather than demoted. There is no picture of Dubai
 * that adds anything to a median price.
 *
 * The figures are set in the display face at a size between a headline and
 * body copy, which the scale did not previously have. That gap is why numbers
 * on this site read as captions: everything was either enormous or small and
 * grey, so a figure computed from 765,000 records was set at the same weight
 * as the line explaining it.
 */
export type MastheadFigure = {
  label: string;
  value: string;
  /** One short line. What the number means, not how it was made. */
  note?: string;
  /** Record count and period, the provenance that makes it checkable. */
  basis?: string;
};

export function ReportMasthead({
  eyebrow,
  title,
  lead,
  figures,
  source,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  figures: readonly MastheadFigure[];
  /** The attribution line, always shown where figures are. */
  source?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section data-surface="light" className="pt-14 pb-16 md:pt-20 md:pb-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
              <h1 className="display-1 mt-5 text-balance">{title}</h1>
            </Reveal>
            {lead ? (
              <Reveal delay={0.08}>
                <p className="body-text mt-7 max-w-measure text-muted-foreground">{lead}</p>
              </Reveal>
            ) : null}
            {children ? <Reveal delay={0.14}>{children}</Reveal> : null}
          </div>

          {/* The figures, at the top of the page, where they belong. */}
          {figures.length > 0 ? (
            <div className="lg:col-span-6 lg:col-start-7">
              <dl className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
                {figures.map((figure, index) => (
                  <Reveal key={figure.label} delay={0.06 * index}>
                    <div className="flex h-full flex-col bg-paper p-6 lg:p-7">
                      <dt className="eyebrow text-gold-ink">{figure.label}</dt>
                      <dd className="mt-4 flex flex-1 flex-col">
                        <span className="font-display text-3xl leading-none tabular-nums lg:text-4xl">
                          {figure.value}
                        </span>
                        {figure.note ? (
                          <span className="caption mt-3 text-muted-foreground">{figure.note}</span>
                        ) : null}
                        {figure.basis ? (
                          <span className="caption mt-auto pt-4 text-muted-foreground/80 tabular-nums">
                            {figure.basis}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
              {source ? (
                <Reveal delay={0.3}>
                  <p className="caption mt-5 flex items-start gap-2.5 text-muted-foreground">
                    <span
                      aria-hidden
                      className={cn("mt-1.5 inline-block size-1 shrink-0 bg-gold-ink")}
                    />
                    {source}
                  </p>
                </Reveal>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
