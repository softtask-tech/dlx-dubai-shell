import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Photo } from "@/components/site/photo";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Bone & Ink chapters.
 *
 * The page is read as a sequence of full-bleed chapters rather than a stack of
 * cards. Three primitives cover the whole homepage: a chapter shell, a band of
 * oversized figures set on the ink inversion, and an index of numbered rows.
 *
 * No shadows, no radii, no tiles. Hairlines and space do the separating.
 */

export function Chapter({
  id,
  index,
  label,
  surface = "paper",
  className,
  children,
  ...props
}: {
  id?: string;
  /** The chapter number, printed in the margin. */
  index?: string;
  label?: string;
  surface?: "paper" | "deep" | "ink";
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  return (
    <section
      id={id}
      data-surface={surface === "ink" ? "ink" : undefined}
      className={cn(
        "relative border-t border-border py-section-lg",
        surface === "paper" && "bg-background text-foreground",
        surface === "deep" && "bg-secondary text-foreground",
        surface === "ink" && "bg-foreground text-background",
        className,
      )}
      {...props}
    >
      <Container>
        {index || label ? (
          <div className="mb-14 flex items-baseline gap-6 border-b border-border pb-5">
            {index ? <span className="eyebrow opacity-60">{index}</span> : null}
            {label ? <span className="eyebrow">{label}</span> : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

/** A chapter that opens with a photograph running to both edges. */
export function ChapterPlate({
  photo,
  sizes = "100vw",
  priority = false,
  className,
  children,
}: {
  photo: PhotoSlug;
  sizes?: string;
  priority?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <figure className={cn("relative w-full overflow-hidden", className)}>
      <Photo slug={photo} sizes={sizes} priority={priority} className="h-full w-full object-cover" />
      {children ? <figcaption className="absolute inset-0">{children}</figcaption> : null}
    </figure>
  );
}

export type Figure = {
  label: string;
  value: string;
  meaning?: string;
};

/** Oversized figures on the ink inversion, each under a gold hairline. */
export function FigureBand({
  figures,
  source,
  action,
}: {
  figures: readonly Figure[];
  source?: string;
  action?: ReactNode;
}) {
  return (
    <div>
      <dl className="grid gap-14 md:grid-cols-3">
        {figures.map((figure) => (
          <Reveal key={figure.label} className="min-w-0">
            <span aria-hidden className="block h-px w-14 bg-brass" />
            <dt className="eyebrow mt-6 opacity-70">{figure.label}</dt>
            <dd className="figure-xl mt-4">{figure.value}</dd>
            {figure.meaning ? <p className="caption mt-5 max-w-xs">{figure.meaning}</p> : null}
          </Reveal>
        ))}
      </dl>
      {source || action ? (
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-6">
          {source ? <p className="caption">{source}</p> : <span />}
          {action}
        </div>
      ) : null}
    </div>
  );
}

export type Row = {
  id: string;
  to: string;
  title: string;
  detail?: string;
  meta?: string;
};

/** A numbered register. Type only, no thumbnails, no cards. */
export function IndexRows({ rows }: { rows: readonly Row[] }) {
  return (
    <ol className="border-t border-border">
      {rows.map((row, i) => (
        <li key={row.id}>
          <Link
            to={row.to}
            className="focus-ring group grid grid-cols-12 items-baseline gap-4 border-b border-border py-8 transition-colors hover:bg-secondary md:py-10"
          >
            <span className="eyebrow col-span-2 opacity-50 md:col-span-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="display-2 col-span-10 text-balance transition-colors group-hover:text-accent md:col-span-6">
              {row.title}
            </span>
            {row.detail ? (
              <span className="caption col-span-10 col-start-3 md:col-span-3 md:col-start-auto">
                {row.detail}
              </span>
            ) : (
              <span className="hidden md:col-span-3 md:block" />
            )}
            <span className="caption col-span-10 col-start-3 md:col-span-2 md:col-start-auto md:text-right">
              {row.meta ?? ""}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
