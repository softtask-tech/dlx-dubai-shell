import monogramBlack from "@/assets/brand/dlx-monogram-black.png";
import monogramWhite from "@/assets/brand/dlx-monogram-white.png";
import primaryBlack from "@/assets/brand/dlx-primary-black.png";
import primaryWhite from "@/assets/brand/dlx-primary-white.png";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The brand mark, from the real logo kit.
 *
 * Two forms, and the choice between them is about room rather than taste. The
 * `monogram` is the DX ligature alone: square, legible at 32px, and the right
 * thing in a masthead where the name is already the first thing on the page.
 * The `primary` lockup stacks the monogram over the full wordmark and needs
 * vertical space, so it belongs in the footer.
 *
 * Both ship in black and white on transparent. `tone` picks the one that will
 * be readable on the surface it lands on, rather than relying on a CSS filter,
 * which would soften the hairlines the mark is built from.
 */
type WordmarkProps = {
  form?: "monogram" | "primary";
  tone?: "ink" | "on-dark";
  className?: string;
};

const SOURCES = {
  monogram: { ink: monogramBlack, "on-dark": monogramWhite },
  primary: { ink: primaryBlack, "on-dark": primaryWhite },
} as const;

/* Intrinsic ratios of the kit files, so the browser reserves the right box and
 * the mark cannot shift the layout as it decodes. */
const RATIO = { monogram: 1, primary: 1.475 } as const;

export function Wordmark({ form = "monogram", tone = "ink", className }: WordmarkProps) {
  const height = form === "monogram" ? 34 : 84;

  return (
    <img
      src={SOURCES[form][tone]}
      alt={site.name}
      width={Math.round(height * RATIO[form])}
      height={height}
      className={cn("block w-auto", className)}
      /* The masthead mark is above the fold on every page; decoding it
       * asynchronously keeps it off the critical path without delaying it. */
      decoding="async"
    />
  );
}
