import { Link } from "@tanstack/react-router";

import type { CommercialProject } from "@/data/off-plan";
import { ConceptProjectImage, ProjectLocation } from "./project-primitives";

export function CommercialProjectCard({
  project,
  dominant = false,
}: {
  project: CommercialProject;
  dominant?: boolean;
}) {
  return (
    <Link
      to="/off-plan/$slug"
      params={{ slug: project.slug }}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <article>
        <div
          className={`relative overflow-hidden bg-muted ${dominant ? "aspect-[16/10]" : "aspect-[4/3]"}`}
        >
          <ConceptProjectImage
            project={project}
            sizes={dominant ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
            className="h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        </div>
        <div className="mt-5 flex items-end justify-between gap-5 border-b border-border pb-5">
          <div>
            <ProjectLocation project={project} />
            <h3 className={`${dominant ? "display-2" : "display-3"} mt-2`}>{project.name}</h3>
            <p className="body-text mt-3 max-w-measure text-muted-foreground">{project.headline}</p>
            <p className="caption mt-3">{project.propertyTypes.join(" · ")}</p>
          </div>
          <span className="eyebrow shrink-0 text-accent">Explore project →</span>
        </div>
      </article>
    </Link>
  );
}
