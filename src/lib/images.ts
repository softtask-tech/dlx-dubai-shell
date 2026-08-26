/**
 * Photography, and the one seam it arrives through.
 *
 * The site is photography-led. Until the client's licensed listing, developer
 * and lifestyle photography lands, every image slot is filled by a stand-in,
 * and every stand-in is requested through this function rather than by typing
 * a URL into a component. That is deliberate: when the real assets arrive there
 * is exactly one place that changes, and the frames, aspect ratios and reserved
 * space around them do not move at all.
 *
 * `seed` is not decoration. It describes the shot the slot is waiting for
 * (`dlx-businessbay-tower-dusk`, `dlx-team-portrait-nadia`), so the brief for
 * the photographer can be read straight out of the source, and so a given slot
 * keeps the same placeholder between builds instead of shuffling.
 */

/**
 * Where placeholders come from.
 *
 * Picsum in production and in preview. Overridable so a sandbox with no
 * outbound network can point at a local stand-in and still see a page with
 * photographs on it.
 */
const BASE = (import.meta.env["VITE_PLACEHOLDER_IMAGE_BASE"] ?? "https://picsum.photos").replace(
  /\/+$/,
  "",
);

/** A placeholder photograph at an exact size. Always give real dimensions. */
export function placeholderImage(seed: string, width: number, height: number): string {
  return `${BASE}/seed/${seed}/${Math.round(width)}/${Math.round(height)}`;
}

/**
 * The image for a slot that may already have a real asset behind it.
 *
 * Pass whatever the database holds. A row with `hero_image_url` set wins; a row
 * without one gets a stand-in at the right size rather than an empty frame or a
 * grey box, so the composition can be judged before the photography exists.
 */
export function imageOr(
  actual: string | null | undefined,
  seed: string,
  width: number,
  height: number,
): string {
  return actual?.trim() ? actual : placeholderImage(seed, width, height);
}
