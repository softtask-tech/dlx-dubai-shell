import { PHOTOS, photoFallback, photoSrcSet, type PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A photograph, served properly.
 *
 * Three things this does that an `<img src>` does not, and all three are the
 * difference between a photography-led page and a slow one:
 *
 *   It offers AVIF first, WebP second and one JPEG last, so a modern browser
 *   takes a frame a fifth of the size without anyone choosing per call site.
 *
 *   It takes `sizes` as a required prop. A `srcset` without an honest `sizes`
 *   makes the browser assume the image is the full viewport wide and download
 *   the largest file for a quarter-width frame, which is worse than shipping
 *   one size.
 *
 *   It reserves the box from the catalogue's intrinsic ratio, so a photograph
 *   arriving late never pushes the page around. Cumulative Layout Shift on an
 *   image-heavy page is almost always this.
 *
 * `priority` is for the one photograph above the fold. It preloads and decodes
 * synchronously; on anything below the fold it is a regression, because it
 * competes with the image the reader is actually looking at.
 */
type PhotoProps = {
  slug: PhotoSlug;
  /** How wide the frame really is, per breakpoint. Required, deliberately. */
  sizes: string;
  /** Overrides the catalogue's alt text where the context needs its own. */
  alt?: string;
  /** Above-the-fold hero only. */
  priority?: boolean;
  /** Applied to the `<img>`, so callers control fit and framing. */
  className?: string;
  /** Applied to the `<picture>`. */
  wrapperClassName?: string;
};

export function Photo({
  slug,
  sizes,
  alt,
  priority = false,
  className,
  wrapperClassName,
}: PhotoProps) {
  const photo = PHOTOS[slug];
  const width = Math.max(...photo.widths);
  const height = Math.round(width / photo.ratio);

  return (
    /* `h-full w-full` on the picture, not only on the img. A `<picture>` is an
       inline wrapper by default, so an `h-full` image inside it resolves
       against a box that is itself auto-height, and the frame silently keeps
       the photograph's own aspect instead of the one the layout asked for.
       Where the parent has no height, `h-full` computes to auto and this
       changes nothing. */
    <picture className={cn("block h-full w-full", wrapperClassName)}>
      <source type="image/avif" srcSet={photoSrcSet(photo, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={photoSrcSet(photo, "webp")} sizes={sizes} />
      <img
        src={photoFallback(photo)}
        alt={alt ?? photo.alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("h-full w-full object-cover", className)}
      />
    </picture>
  );
}
