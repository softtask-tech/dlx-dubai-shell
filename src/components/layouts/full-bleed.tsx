import type { ReactNode } from "react";

import { Parallax } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A photograph the type sits inside, rather than beside.
 *
 * The cinematic family. It is the most expensive thing on the page in
 * attention terms, so it is used where the reader should stop: the hero, and
 * at most one moment further down.
 *
 * The scrim is not optional and not decorative. Light type on an unknown
 * photograph is a contrast gamble; the gradient is what turns it into a
 * certainty, weighted to wherever the type actually is.
 */
export function FullBleed({
  photo,
  children,
  align = "end",
  height = "screen",
  priority = false,
  className,
  "aria-label": ariaLabel,
}: {
  photo: PhotoSlug;
  children: ReactNode;
  /** Where the type sits in the frame. */
  align?: "end" | "center";
  /** `screen` for a hero, `band` for a shorter cinematic break. */
  height?: "screen" | "band";
  priority?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      data-surface="dark"
      aria-label={ariaLabel}
      className={cn(
        "relative flex overflow-hidden",
        height === "screen" ? "min-h-[100svh] pb-16 lg:pb-24" : "min-h-[68svh] py-section",
        align === "end" ? "items-end" : "items-center",
        className,
      )}
    >
      <Parallax speed={0.82} className="absolute inset-x-0 -top-[8%] h-[116%]">
        <Photo
          slug={photo}
          sizes="100vw"
          priority={priority}
          className="h-full w-full object-cover"
        />
      </Parallax>

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          align === "end" ? "bg-gradient-to-t from-ink/95 via-ink/45 to-ink/15" : "bg-ink/65",
        )}
      />

      <Container className="relative">{children}</Container>
    </section>
  );
}
