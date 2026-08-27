import type { ReactNode } from "react";

import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * A green-black band across the page.
 *
 * The light canvas is the site's ground; these are the moments it cuts to
 * black. Used deliberately and rarely: the hero, the market read, the advisor,
 * the footer. Alternating dark and light is what gives a long page a pulse,
 * and doing it more often than that turns the pulse into a stripe.
 *
 * `data-surface="dark"` re-points every semantic token, so anything nested
 * inside picks up the right palette without knowing where it is.
 */
export function DarkAnchor({
  children,
  className,
  bleed = false,
  panel = false,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  /** Skip the container, for content that runs to the page edge. */
  bleed?: boolean;
  /** The lifted panel tone, for a dark band that sits next to another one. */
  panel?: boolean;
  "aria-label"?: string;
}) {
  return (
    <section
      data-surface="dark"
      aria-label={ariaLabel}
      className={cn("py-section", panel && "bg-ink-panel", className)}
    >
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}
