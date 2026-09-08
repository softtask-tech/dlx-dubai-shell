import type { HTMLAttributes, ReactNode } from "react";

import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * A beat between sections.
 *
 * The site reads as a template and the reason is structural rather than
 * decorative: twenty-five sections open with the same four moves — eyebrow,
 * headline, gold hairline, grey paragraph — and every one of them carries the
 * same weight. Nothing is heavier or lighter than anything else, so nothing
 * lands. A page with no light passages has no loud ones either.
 *
 * This is the light passage. One sentence, set large, with nothing under it to
 * explain itself and no call to action to move you along. It is not a section
 * of content; it is the pause between two of them, and it works precisely
 * because it withholds everything a section normally offers.
 *
 * Rules that keep it from becoming another template:
 *
 *   - **One sentence.** If it needs two it is a section, not a beat.
 *   - **No eyebrow.** A beat that labels itself is a section again.
 *   - **The footnote is evidence, not elaboration.** It exists so the sentence
 *     can be checked, which is the difference between a claim and a slogan.
 *     Without something checkable to put there, leave it out.
 *   - **Never twice in a row**, and never adjacent to another statement.
 */
export function StatementBand({
  children,
  footnote,
  align = "start",
  className,
  ...rest
}: {
  /** One sentence. */
  children: ReactNode;
  /** Something checkable that supports it. Optional, and better absent than padded. */
  footnote?: ReactNode;
  align?: "start" | "center";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">) {
  return (
    <Section
      className={cn("py-24 md:py-32 lg:py-40", className)}
      {...rest}
    >
      <div className={cn("max-w-4xl", align === "center" && "mx-auto text-center")}>
        <Reveal>
          {/*
           * Set at display-2 rather than display-1. The beat should read as
           * quieter than the page's headline voice, not as a second hero
           * competing with the first — the weight comes from the space around
           * it, which is the whole point.
           */}
          <p className="display-2 text-balance">{children}</p>
        </Reveal>

        {footnote ? (
          <Reveal delay={0.12}>
            <p
              className={cn(
                "caption mt-10 max-w-measure border-t border-border pt-5 text-muted-foreground",
                align === "center" && "mx-auto",
              )}
            >
              {footnote}
            </p>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
