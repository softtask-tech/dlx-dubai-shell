import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds the hover treatment used when the whole card is a link. */
  interactive?: boolean;
};

/**
 * Editorial card shell.
 *
 * A hairline and whitespace, never a shadow or a rounded corner — depth in this
 * design comes from type and space, not elevation. Compose with the parts
 * below; `interactive` adds the hover state for a card that is itself a link.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group relative border border-border bg-card text-card-foreground",
        interactive && "transition-colors duration-base ease-editorial hover:border-accent",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

type CardMediaProps = React.HTMLAttributes<HTMLDivElement> & {
  /** CSS aspect ratio for the frame, e.g. "4 / 5" for a portrait plate. */
  ratio?: string;
};

/**
 * Image frame. Clips its child and, inside an interactive card, drifts the
 * image in slightly on hover — the one moment of movement a card gets.
 */
const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, ratio = "3 / 2", style, ...props }, ref) => (
    <div
      ref={ref}
      style={{ aspectRatio: ratio, ...style }}
      className={cn(
        "overflow-hidden bg-muted [&>img]:h-full [&>img]:w-full [&>img]:object-cover",
        "[&>img]:transition-transform [&>img]:duration-slow [&>img]:ease-editorial",
        "group-hover:[&>img]:scale-[1.03]",
        className,
      )}
      {...props}
    />
  ),
);
CardMedia.displayName = "CardMedia";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-3 p-8", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("display-3", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("caption", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("body-text px-8 pb-8", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between border-t border-border px-8 py-5",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardMedia, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
