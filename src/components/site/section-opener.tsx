import type { ReactNode } from "react";

import { Reveal } from "@/components/site/reveal";
import { Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * How a section announces itself.
 *
 * Every section on the site was assembling this by hand: an Eyebrow, a margin,
 * an h2, sometimes a lead, each with slightly different spacing. Slightly
 * different is the problem. On a page this spare the only thing creating
 * rhythm is the distance between a label and the sentence under it, and when
 * that distance changes from section to section the page stops feeling
 * composed and starts feeling assembled.
 *
 * The gold hairline is the one flourish. It draws itself in from the leading
 * edge as the section arrives, a beat behind the words, which is what makes
 * the opening read as typesetting rather than as a heading with a rule under
 * it. Under reduced motion it is simply a line that is already there.
 *
 * `align="wide"` is for a section that runs the full measure; `align="split"`
 * holds the opener in a narrow column so a chart or a list can sit beside it.
 */
export function SectionOpener({
  eyebrow,
  title,
  lead,
  align = "wide",
  className,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "wide" | "split";
  className?: string;
  /** An action or a link, directly under the opener. */
  children?: ReactNode;
}) {
  return (
    <div className={cn(align === "wide" ? "max-w-3xl" : "max-w-md", className)}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}

      <Reveal delay={eyebrow ? 0.05 : 0}>
        <h2 className={cn("display-2 max-w-[22ch] text-balance", eyebrow && "mt-5")}>{title}</h2>
      </Reveal>

      {/* The rule follows the words rather than leading them. The delay comes
          from Reveal rather than an inline custom property, which React's
          CSSProperties type does not accept without a cast. */}
      <Reveal delay={0.12}>
        <hr className="rule-draw mt-8 max-w-xs" />
      </Reveal>

      {lead ? (
        <Reveal delay={0.15}>
          <p className="body-text mt-7 max-w-measure text-muted-foreground">{lead}</p>
        </Reveal>
      ) : null}

      {children ? <Reveal delay={0.2}>{children}</Reveal> : null}
    </div>
  );
}
