import { useState } from "react";

import { Reveal } from "./reveal";
import { Section, Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Listing gallery: one large plate with a strip of thumbnails beneath it.
 *
 * A lightbox would be the portal answer. This reads as a magazine spread
 * instead — the selected image stays in the flow of the page at full width, and
 * the thumbnails are real buttons so the whole thing is keyboard-operable.
 */
export function Gallery({ images, title }: { images: readonly string[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (!current) return null;

  return (
    <Section>
      <Reveal>
        <Eyebrow>Gallery</Eyebrow>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-8 aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={current}
            alt={`${title} — image ${selected + 1} of ${images.length}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </Reveal>

      {images.length > 1 ? (
        <Reveal delay={0.12}>
          <div
            className="mt-4 flex gap-4 overflow-x-auto pb-2"
            role="group"
            aria-label={`${title} gallery thumbnails`}
          >
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === selected}
                className={cn(
                  "h-20 w-28 shrink-0 overflow-hidden border transition-colors duration-quick ease-editorial",
                  index === selected ? "border-accent" : "border-transparent hover:border-border",
                )}
              >
                <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </Reveal>
      ) : null}
    </Section>
  );
}
