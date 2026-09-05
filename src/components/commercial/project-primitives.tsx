import { Link } from "@tanstack/react-router";

import type { CommercialProject, CommercialProjectMedia } from "@/data/off-plan";
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
      <div className="flex min-h-56 items-end border border-border bg-paper-cool p-7">
        <div>
          <Eyebrow>Brochure and full gallery</Eyebrow>
          <p className="body-text mt-4 text-muted-foreground">To be confirmed</p>
        </div>
      </div>
    </div>
  );
}

export function ConceptDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`border border-accent bg-accent-soft text-foreground ${compact ? "px-4 py-3" : "p-6"}`}
      role="note"
    >
      <p className="eyebrow text-accent">Concept preview — not a real listing</p>
      {!compact ? (
        <p className="caption mt-3 max-w-2xl">
          Fictional names, developer, location and illustrative AI-generated architecture. No price,
          availability, permit, registration or commercial claim is being made.
        </p>
      ) : null}
    </div>
  );
}

export function CommercialPrice({ amount }: { amount: number | null }) {
  return (
    <div>
      <p className="eyebrow">Starting price</p>
      <p className="display-3 mt-2">{amount === null ? "To be confirmed" : `AED ${amount}`}</p>
    </div>
  );
}

export function ProjectLocation({ project }: { project: CommercialProject }) {
  return (
    <p className="caption text-muted-foreground">
      {project.locationName} · {project.projectType}
    </p>
  );
}

export function HandoverStatus({ project }: { project: CommercialProject }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
      <Fact label="Handover" value={project.handover ?? "To be confirmed"} />
      <Fact label="Construction" value={project.constructionStatus} />
      <Fact label="Bedrooms" value={project.bedrooms ?? "To be confirmed"} />
      <Fact label="Unit sizes" value={project.unitSizeRangeSqFt ?? "To be confirmed"} />
      <Fact label="Property types" value={project.propertyTypes.join(", ")} />
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
      <p className="body-text mt-4 text-muted-foreground">
        {project.paymentPlan.length === 0 ? "To be confirmed" : "Payment stages available"}
      </p>
    </div>
  );
}

export function FloorPlanViewer({ project }: { project: CommercialProject }) {
  return (
    <div className="border-y border-border py-7">
      <Eyebrow>Floor plans</Eyebrow>
      <p className="body-text mt-4 text-muted-foreground">
        {project.floorPlans.length === 0 ? "To be confirmed" : "Floor plans available"}
      </p>
    </div>
  );
}

export function ConsultantModule({ project }: { project: CommercialProject }) {
  return (
    <div className="border border-border p-7">
      <Eyebrow>Assigned consultant</Eyebrow>
      <p className="body-text mt-4 text-muted-foreground">
        {project.assignedConsultant ?? "To be confirmed"}
      </p>
    </div>
  );
}

export function LeadActions() {
  const actions = [
    "Request prices and availability",
    "Get the brochure",
    "Ask about the payment plan",
    "Book a consultation",
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((label, index) => (
        <a key={label} href="#enquire" className="inline-flex">
          <Button variant={index === 0 ? "accent" : "primary"} size="md">
            {label}
          </Button>
        </a>
      ))}
      <Button disabled title="Disabled for a fictional project preview">
        Continue on WhatsApp
      </Button>
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
      <p className="body-text mt-4">Illustrative commercial template using a local fixture.</p>
      <p className="caption mt-3 text-muted-foreground">
        Updated {project.updatedAt}. Not connected to an official DLD record. Images are
        AI-generated architectural concepts and do not represent an actual place.
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
      <Eyebrow>Similar concept previews</Eyebrow>
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
