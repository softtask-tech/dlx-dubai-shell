import * as React from "react";
import { Link as RouterLink, type LinkComponentProps } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const linkVariants = cva(
  "outline-none transition-colors duration-quick ease-editorial focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        /** Running text: the rule draws itself in from the left on hover. */
        default: "link-underline text-foreground hover:text-accent",
        /** Uppercase label, for navigation and calls to action. */
        eyebrow: "eyebrow link-underline text-foreground hover:text-accent",
        /** Muted until hovered, lists, footers, secondary trails. */
        quiet: "text-foreground/70 hover:text-accent",
        /** Sits inside a sentence and stays underlined. */
        inline:
          "text-foreground underline decoration-border underline-offset-4 hover:decoration-accent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type LinkVariants = VariantProps<typeof linkVariants>;

export type TextLinkProps = LinkComponentProps<"a"> & LinkVariants;

/**
 * Internal link. Wraps the router's `Link`, so prefetching, active state and
 * `aria-current` all come for free, routes are type-checked at the call site.
 */
export function TextLink({ className, variant, ...props }: TextLinkProps) {
  return <RouterLink className={cn(linkVariants({ variant }), className)} {...props} />;
}

export type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkVariants;

/**
 * Link off the site. Always opens in a new tab with `rel="noopener noreferrer"`,
 * so no caller has to remember the security attributes.
 */
export function ExternalLink({ className, variant, children, ...props }: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(linkVariants({ variant }), className)}
      {...props}
    >
      {children}
    </a>
  );
}

export { linkVariants };
