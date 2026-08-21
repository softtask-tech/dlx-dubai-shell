import { Reveal } from "./reveal";
import { Eyebrow } from "@/components/ui/section";
import type { FaqEntry } from "@/lib/schema";

type FaqProps = {
  eyebrow?: string;
  title?: string;
  entries: readonly FaqEntry[];
};

/**
 * Editorial FAQ block — answer-shaped content in plain buyer language.
 *
 * Built on native `<details>`, so the answers exist in the server-rendered HTML
 * for crawlers and AI even before JavaScript runs, and the disclosure is
 * keyboard-operable for free. Any page that renders this should pass the same
 * entries to `faqSchema()` — schema and visible copy must always match.
 */
export function Faq({ eyebrow = "Questions", title = "Asked and answered", entries }: FaqProps) {
  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-6 font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        </Reveal>
      </div>

      <div className="lg:col-span-8 lg:col-start-5">
        <div>
          {entries.map((entry, i) => (
            <Reveal key={entry.question} delay={i * 0.06}>
              <details className="group border-t border-border last:border-b">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                  <h3 className="font-display text-xl leading-snug transition-colors group-open:text-accent md:text-2xl">
                    {entry.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="eyebrow shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-8 text-base leading-relaxed text-muted-foreground">
                  {entry.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
