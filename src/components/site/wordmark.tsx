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
 * `monogram` is the DX ligature alone, and it is the right thing in a masthead:
 * an 80px bar can give a mark about 44px, and 44px of ligature is confident
 * where 44px of stacked lockup would set the wordmark under it about four
 * pixels tall. The `primary` lockup carries the name and so needs to be sized
 * in the dozens of pixels per line, which only the footer has room for.
 *
 * Both files are trimmed to their ink by `scripts/trim-brand.mjs`. The kit
 * ships them on a padded canvas, and untrimmed the padding is what a CSS
 * height actually sizes: the monogram's ink filled 53% of its box, so half of
 * every masthead was empty pixels.
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
const RATIO = { monogram: 0.965, primary: 1.594 } as const;

export function Wordmark({ form = "monogram", tone = "ink", className }: WordmarkProps) {
  const height = form === "monogram" ? 44 : 140;

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
