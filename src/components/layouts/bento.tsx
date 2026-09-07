import type { ComponentProps, ElementType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Photo } from "@/components/site/photo";
import type { PhotoSlug } from "@/lib/photos";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * The bento architecture.
 *
 * The v3 diagnosis was that the site still read as a document: full-width bands
 * stacked down a page, each one a headline and a paragraph, separated by empty
 * space. Correct for an essay, wrong for a brokerage whose whole claim is that
 * it holds the data.
 *
 * So a page is now a grid of tiles. A figure, a photograph, a chart and an
 * invitation sit beside each other at different sizes, and the reader chooses
 * the order. The tile owns its own surface, hairline and hover state, which is
 * what stops the grid from reading as a dashboard: every cell is a designed
 * object rather than a table cell.
 *
 * Spans are 12-column at lg, 6 at md, 2 at base, and are passed as Tailwind
 * classes by the caller: a `size` prop would turn the library back into a
 * template, which is the mistake documented in ./index.tsx.
 */

/** The grid itself. Give it tiles; give the tiles col-span classes. */
export function BentoGrid({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("bento", className)} {...props}>
      {children}
    </div>
  );
}

/** A section that is a bento grid inside the page container. */
export function BentoSection({
  head,
  className,
  children,
  ...props
}: ComponentProps<"section"> & { head?: ReactNode }) {
  return (
    <section className={cn("py-section-sm", className)} {...props}>
      <Container>
        {head}
        <BentoGrid className={head ? "mt-10" : undefined}>{children}</BentoGrid>
      </Container>
    </section>
  );
}

/**
 * The section opening: eyebrow, headline, one sentence, one action, all on one
 * line at desktop so the grid starts high on the screen.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow text-accent">{eyebrow}</p> : null}
        <h2 className="display-2 mt-4 text-balance">{title}</h2>
      </div>
      <div className="max-w-md lg:text-end">
        {lead ? <p className="body-text text-muted-foreground">{lead}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

type TileProps<T extends ElementType> = {
  as?: T;
  /** Brass keyline: marks the one tile in a grid that leads. */
  accent?: boolean;
  /** Lift and warm on hover. Set automatically by TileLink. */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, "as" | "className" | "children">;

/** A single tile. */
export function Tile<T extends ElementType = "div">({
  as,
  accent,
  interactive,
  className,
  children,
  ...props
}: TileProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "tile",
        accent && "tile-accent",
        interactive && "tile-interactive",
        "col-span-2 md:col-span-3 lg:col-span-4",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** A tile that navigates. */
export function TileLink({
  className,
  children,
  accent,
  ...props
}: ComponentProps<typeof Link> & { accent?: boolean }) {
  return (
    <Link
      className={cn(
        "tile tile-interactive focus-ring col-span-2 md:col-span-3 lg:col-span-4",
        accent && "tile-accent",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * A figure tile: one number, one plain-English line under it.
 *
 * The number is never alone: the rule is that a figure always carries
 * a sentence saying what it means for the reader.
 */
export function StatTile({
  label,
  value,
  meaning,
  source,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  meaning?: ReactNode;
  source?: ReactNode;
  className?: string;
}) {
  return (
    <Tile className={cn("justify-between gap-8", className)}>
      <p className="eyebrow">{label}</p>
      <div>
        <p className="figure-xl text-accent">{value}</p>
        {meaning ? <p className="caption mt-3 text-muted-foreground">{meaning}</p> : null}
        {source ? <p className="eyebrow mt-4 text-muted-foreground/70">{source}</p> : null}
      </div>
    </Tile>
  );
}

/**
 * A tile that is a photograph, with the type overlaid at the bottom edge.
 * Optionally a link.
 */
export function MediaTile({
  photo,
  src,
  alt,
  to,
  params,
  ratio = "aspect-4/3",
  className,
  children,
}: {
  photo?: PhotoSlug;
  src?: string | null;
  alt?: string;
  to?: ComponentProps<typeof Link>["to"];
  params?: Record<string, string>;
  ratio?: string;
  className?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <div className={cn("absolute inset-0", ratio)}>
        {src ? (
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
          />
        ) : photo ? (
          <Photo
            slug={photo}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent"
      />
      <div className="relative z-10 p-6 lg:p-8">{children}</div>
    </>
  );

  const shared = cn(
    "tile tile-media group relative col-span-2 md:col-span-3 lg:col-span-4",
    ratio,
    className,
  );

  if (to !== undefined) {
    return (
      <Link to={to} params={params as never} className={cn(shared, "tile-interactive focus-ring")}>
        {inner}
      </Link>
    );
  }
  return <div className={shared}>{inner}</div>;
}

/** A quote, set large, with the attribution beneath. */
export function QuoteTile({
  quote,
  attribution,
  className,
}: {
  quote: ReactNode;
  attribution?: ReactNode;
  className?: string;
}) {
  return (
    <Tile className={cn("justify-between gap-8", className)}>
      <blockquote className="display-3 text-balance">“{quote}”</blockquote>
      {attribution ? <figcaption className="eyebrow">{attribution}</figcaption> : null}
    </Tile>
  );
}
