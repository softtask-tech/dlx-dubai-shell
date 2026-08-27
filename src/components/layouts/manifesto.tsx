import type { ReactNode } from "react";

import { RevealText } from "@/components/motion";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Type alone, once.
 *
 * The one section on a page allowed to be nothing but a sentence. It works
 * because everything around it is photography and data: silence is only loud
 * in a room with noise in it. Two of these on one page and neither lands.
 *
 * Set in the serif accent, because this is exactly the moment the second
 * typeface exists for, and offset into the grid rather than centred, so it
 * reads as a considered placement rather than a slide.
 */
export function Manifesto({
  children,
  footnote,
  className,
}: {
  children: ReactNode;
  /** A quiet attribution or qualifier under the statement. */
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-section-lg", className)}>
      <Container>
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-9 lg:col-start-3">
            <RevealText as="p" className="accent-line text-balance">
              {children}
            </RevealText>
            {footnote ? <div className="caption mt-10">{footnote}</div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
