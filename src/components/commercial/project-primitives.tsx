import { Link } from "@tanstack/react-router";

import type { CommercialProject, CommercialProjectMedia } from "@/data/off-plan";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

export function ConceptProjectImage({
  project,
  className,
  priority = false,
  sizes = "100vw",
}: {
  project: CommercialProject;
  className: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <ConceptMediaImage
      media={project.hero}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}

export function ConceptMediaImage({
  media,
  className,
  priority = false,
  sizes = "100vw",
}: {
  media: CommercialProjectMedia;
  className: string;
  priority?: boolean;
  sizes?: string;
}) {
  const base = media.src;
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
        sizes={sizes}
      />
      <img
        src={`${base}-1280.jpg`}
        alt={media.alt}
        width={1536}
        height={1024}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={className}
      />
    </picture>
  );
}

export function ProjectGallery({ project }: { project: CommercialProject }) {
  if (project.gallery.length === 0) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {project.gallery.map((item) => (
        <figure key={item.src}>
          <div className="aspect-[3/2] overflow-hidden bg-muted">
            <ConceptMediaImage
              media={item}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="caption mt-3 text-muted-foreground">{item.caption}</figcaption>
        </figure>
      ))}
      <div className="flex min-h-56 items-end border border-border bg-secondary p-7">
        <div>
          <Eyebrow>Developer brochure and full gallery</Eyebrow>
          <p className="body-text mt-4 text-muted-foreground">
            The complete brochure, official renders and floor plans come straight from the
            developer. Ask and we will send them.
          </p>
          <a href="#enquire" className="eyebrow link-underline mt-5 inline-block text-accent">
            Request the brochure
          </a>
        </div>
      </div>
    </div>
  );
}

/** States plainly where the facts come from and what is not yet confirmed. */
export function SourceDisclosure({
  project,
  compact = false,
}: {
  project: CommercialProject;
  compact?: boolean;
}) {
  return (
    <div
      className={`border border-accent bg-accent-soft text-foreground ${compact ? "px-4 py-3" : "p-6"}`}
      role="note"
    >
      <p className="eyebrow text-accent">Facts from the developer's own brochure</p>
      {!compact ? (
        <p className="caption mt-3 max-w-2xl">
          Source: {project.sourceLabel}. Prices, payment terms and handover dates are set per
          release and are confirmed to you in writing. We do not publish figures the developer has
          not issued. Images on this page are the developer's own renders.
        </p>

      ) : null}
    </div>
  );
}

export function CommercialPrice({ project }: { project: CommercialProject }) {
  return (
    <div>
      <p className="eyebrow">Starting price</p>
      <p className="display-3 mt-2">
        {project.startingPrice === null
          ? "On the current release list"
          : `AED ${project.startingPrice.toLocaleString("en-AE")}`}
      </p>
      <p className="caption mt-3 text-muted-foreground">{project.priceNote}</p>
    </div>
  );
}

export function ProjectLocation({ project }: { project: CommercialProject }) {
  return (
    <p className="caption text-muted-foreground">
      {project.locationName} · {project.developerName}
    </p>
  );
}

export function ProjectFigures({ project }: { project: CommercialProject }) {
  if (project.figures.length === 0) return null;
  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
      {project.figures.map((figure) => (
        <div key={figure.label} className="bg-background p-6">
          <p className="display-3 text-accent">{figure.value}</p>
          <p className="eyebrow mt-3">{figure.label}</p>
          <p className="body-text mt-2 text-muted-foreground">{figure.meaning}</p>
        </div>
      ))}
    </div>
  );
}

export function ProjectCollections({ project }: { project: CommercialProject }) {
  if (project.collections.length === 0) return null;
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2">
      {project.collections.map((collection) => (
        <li key={collection.name} className="bg-background p-6">
          <h3 className="display-3">{collection.name}</h3>
          <p className="eyebrow mt-3">{collection.homeType}</p>
          <p className="caption mt-2 text-muted-foreground">{collection.bedrooms}</p>
          <p className="body-text mt-4 text-muted-foreground">{collection.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProjectConnectivity({ project }: { project: CommercialProject }) {
  if (project.connectivity.length === 0) return null;
  return (
    <dl className="mt-6 divide-y divide-border border-y border-border">
      {project.connectivity.map((item) => (
        <div key={item.place} className="flex items-baseline justify-between gap-5 py-3">
          <dt className="body-text">{item.place}</dt>
          <dd className="caption text-muted-foreground">{item.distance}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HandoverStatus({ project }: { project: CommercialProject }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
      <Fact label="Handover" value={project.handover ?? "Confirmed per release"} />
      <Fact label="Status" value={project.constructionStatus} />
      <Fact label="Bedrooms" value={project.bedrooms ?? "Confirmed per release"} />
      <Fact label="Unit sizes" value={project.unitSizeRangeSqFt ?? "Confirmed per release"} />
      <Fact label="Home types" value={project.propertyTypes.join(", ")} />
      <Fact label="Developer" value={project.developerName} />
    </dl>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background p-5 sm:p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="body-text mt-2">{value}</dd>
    </div>
  );
}

export function ProjectMedia({ project }: { project: CommercialProject }) {
  return (
    <figure>
      <div className="aspect-[3/2] overflow-hidden bg-muted">
        <ConceptProjectImage project={project} className="h-full w-full object-cover" />
      </div>
      <figcaption className="caption mt-3 text-muted-foreground">{project.hero.caption}</figcaption>
    </figure>
  );
}

export function PaymentPlanTimeline({ project }: { project: CommercialProject }) {
  return (
    <div className="border-y border-border py-7">
      <Eyebrow>Payment plan</Eyebrow>
      {project.paymentPlan.length === 0 ? (
        <p className="body-text mt-4 text-muted-foreground">{project.paymentPlanNote}</p>
      ) : (
        <dl className="mt-4 divide-y divide-border">
          {project.paymentPlan.map((stage) => (
            <div key={stage.stage} className="flex items-baseline justify-between gap-5 py-3">
              <dt className="body-text">{stage.stage}</dt>
              <dd className="display-3">{stage.share}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function FloorPlanViewer({ project }: { project: CommercialProject }) {
  return (
    <div className="border-y border-border py-7">
      <Eyebrow>Floor plans</Eyebrow>
      {project.floorPlans.length === 0 ? (
        <p className="body-text mt-4 text-muted-foreground">Available on request.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {project.floorPlans.map((plan) => (
            <li key={plan.label}>
              <p className="body-text">{plan.label}</p>
              <p className="caption mt-1 text-muted-foreground">{plan.note}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConsultantModule({ project }: { project: CommercialProject }) {
  return (
    <div className="border border-border p-7">
      <Eyebrow>Your consultant</Eyebrow>
      <p className="body-text mt-4 text-muted-foreground">
        {project.assignedConsultant ??
          "A named consultant handles this project from your first question to handover, not a call centre."}
      </p>
      <a
        href={`tel:${brand.contact.phoneE164}`}
        className="eyebrow link-underline mt-5 inline-block text-foreground"
      >
        {brand.contact.phone}
      </a>
      {/* The people behind the promise, one click away, which is what makes the
       * sentence above verifiable rather than a claim. */}
      <div className="mt-3">
        <Link to="/team" className="eyebrow link-underline text-muted-foreground">
          Meet the consultants
        </Link>
      </div>
    </div>
  );
}


export function LeadActions({ projectName }: { projectName: string }) {
  const message = encodeURIComponent(`Hello DLX, I would like the details for ${projectName}.`);
  return (
    <div className="flex flex-wrap gap-3">
      {["Request prices and availability", "Get the brochure", "Ask about the payment plan"].map(
        (label, index) => (
          <a key={label} href="#enquire" className="inline-flex">
            <Button variant={index === 0 ? "accent" : "primary"} size="md">
              {label}
            </Button>
          </a>
        ),
      )}
      <a
        href={`https://wa.me/${brand.contact.whatsapp}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Button>Continue on WhatsApp</Button>
      </a>
      <a
        href="#ask=What%20should%20I%20compare%20when%20buying%20off-plan%3F"
        className="inline-flex"
      >
        <Button>Ask the AI advisor</Button>
      </a>
    </div>
  );
}

export function TrustSourcePanel({ project }: { project: CommercialProject }) {
  return (
    <div className="border-l border-accent pl-6">
      <Eyebrow>Source and status</Eyebrow>
      <p className="body-text mt-4">{project.sourceLabel}</p>
      <p className="caption mt-3 text-muted-foreground">
        Updated {project.updatedAt}. Figures on this page are quoted from the developer's published
        material, and the images are the developer's own renders. No Dubai Land Department
        transaction record is attached to this project.
      </p>

    </div>
  );
}

export function RelatedProjects({
  project,
  projects,
}: {
  project: CommercialProject;
  projects: readonly CommercialProject[];
}) {
  const related = project.similarProjectSlugs
    .map((slug) => projects.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is CommercialProject => Boolean(candidate));
  if (related.length === 0) return null;
  return (
    <div>
      <Eyebrow>Also in focus</Eyebrow>
      <div className="mt-5 flex flex-col gap-3">
        {related.map((candidate) => (
          <Link
            key={candidate.slug}
            to="/off-plan/$slug"
            params={{ slug: candidate.slug }}
            className="display-3 link-underline"
          >
            {candidate.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
