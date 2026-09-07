import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { ConceptProjectImage } from "@/components/commercial/project-primitives";

/**
 * The two live mandates, and only the two.
 *
 * There is no third card, no "more coming soon" tile and no placeholder. A
 * grid padded out to look fuller than the practice is would undo the exact
 * claim the section makes, which is that mandates are taken deliberately
 * rather than by volume. Two real projects, stated plainly, is the argument.
 *
 * The card carries a location tag and nothing more of the city. The homepage
 * stays Dubai-voiced; the Sharjah and Abu Dhabi context belongs on each
 * project's own page, where someone has chosen to read about it.
 *
 * The information strip uses the dark glass rather than the light one. These
 * are developer renders, bright and daylit, and a 10% white panel over a pale
 * render is white text on nearly-white. The tint has to come from the panel.
 *
 * Portrait on a phone, landscape from the small breakpoint up. A 16:9 crop on
 * a 360px screen is a 200px band that reads as a banner; the taller crop is
 * what makes a phone feel cinematic rather than cramped.
 */
export function OffPlanFocus({
  projects,
  lineFor,
}: {
  projects: readonly CommercialProject[];
  /** The homepage's own one-liner per project, from the route. */
  lineFor: (slug: string) => string | undefined;
}) {
  if (projects.length === 0) return null;

  return (
    <ul className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6">
      {projects.map((project) => (
        <li key={project.slug}>
          <Link
            to="/off-plan/$slug"
            params={{ slug: project.slug }}
            className="focus-ring group relative block aspect-[4/5] overflow-hidden sm:aspect-[4/3]"
          >
            <ConceptProjectImage
              project={project}
              sizes="(min-width: 768px) 46vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-cinematic ease-editorial group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />

            {/* No `data-surface` here on purpose: it paints an unlayered
                background that would beat the glass utility outright. The
                on-dark colours below are global tokens, so they resolve
                without one. See the note by the glass utilities. */}
            <div className="glass-dark absolute inset-x-3 bottom-3 p-5 sm:inset-x-4 sm:bottom-4 sm:p-6">
              <p className="eyebrow text-gold">
                {project.locationName} · {project.developerName}
              </p>
              <h3 className="display-3 mt-2 text-on-dark">{project.name}</h3>
              <p className="caption mt-2 text-on-dark-muted">
                {lineFor(project.slug) ?? project.headline}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
