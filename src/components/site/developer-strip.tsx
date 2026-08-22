import { Link } from "@tanstack/react-router";

import { stagger } from "@/lib/motion";
import { Reveal } from "./reveal";
import type { Developer } from "@/data/types";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * The developers DLX represents.
 *
 * Names set in the editorial serif rather than a row of logos: a logo wall is
 * what a portal does, and half the logos would be the wrong colour anyway.
 * Renders nothing until there are partners to name.
 */
export function DeveloperStrip({ developers }: { developers: readonly Developer[] }) {
  if (developers.length === 0) return null;

  return (
    <Section>
      <Reveal>
        <Eyebrow>Developer partnerships</Eyebrow>
      </Reveal>
      <div className="mt-10 flex flex-wrap items-baseline gap-x-12 gap-y-6">
        {developers.map((developer, index) => (
          <Reveal key={developer.id} delay={stagger(index)}>
            <Link
              to="/developers/$slug"
              params={{ slug: developer.slug }}
              className="display-3 text-foreground/70 transition-colors duration-base ease-editorial hover:text-foreground"
            >
              {developer.name}
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
