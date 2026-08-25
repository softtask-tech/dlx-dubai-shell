import * as React from "react";
import { cn } from "@/lib/utils";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Remove vertical rhythm padding */
  flush?: boolean;
  /** Full-bleed: skip the max-width container */
  bleed?: boolean;
};

/** Section container, owns the site's horizontal gutters and vertical rhythm. */
export function Section({ className, children, flush, bleed, ...props }: SectionProps) {
  return (
    <section className={cn(!flush && "py-section", className)} {...props}>
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}

export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-shell px-6 md:px-10 lg:px-16", className)} {...props}>
      {children}
    </div>
  );
}

export function Eyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("eyebrow block", className)} {...props}>
      {children}
    </span>
  );
}
