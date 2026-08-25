import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva("eyebrow inline-flex items-center whitespace-nowrap leading-none", {
  variants: {
    variant: {
      /** Hairline outline, the default, quietest form. */
      outline: "border border-border px-3 py-2 text-foreground",
      /** Soft sand field, for grouping without shouting. */
      soft: "bg-secondary px-3 py-2 text-foreground",
      /** The one loud form: solid sand. Use sparingly, one per view. */
      accent: "bg-accent px-3 py-2 text-accent-foreground",
      /** No container at all: a bare label in a row of metadata. */
      bare: "text-muted-foreground",
    },
  },
  defaultVariants: { variant: "outline" },
});

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>;

/**
 * Small uppercase label, a district, a status, a guide category.
 *
 * Purely presentational: when a tag filters or navigates, wrap it in a button
 * or link so it is reachable by keyboard.
 */
export function Tag({ className, variant, ...props }: TagProps) {
  return <span className={cn(tagVariants({ variant }), className)} {...props} />;
}

export { tagVariants };
