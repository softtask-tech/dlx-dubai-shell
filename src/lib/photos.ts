/**
 * The photograph library.
 *
 * The site is photography-led, which means an image is content, not
 * decoration, and every slot is a deliberate choice of frame rather than
 * whatever was to hand. This is the catalogue: one entry per photograph, with
 * the alt text written once, next to the file, so the same picture is never
 * described two different ways on two different pages.
 *
 * `tone` is the useful field. It says whether a frame can carry light type
 * across it. A `dark` photograph takes an on-dark headline with a light scrim;
 * a `light` one needs the type beside it or a heavy scrim, and putting white
 * text on it because the layout wanted white text there is how a page ends up
 * illegible in the one place it most needs to be read.
 *
 * Files come from `scripts/build-photos.mjs`, which emits AVIF and WebP at four
 * widths plus one JPEG fallback. Nothing resizes at request time.
 */

export type PhotoTone = "dark" | "mixed" | "light";

export type Photo = {
  slug: string;
  /** Written for a reader who cannot see it, not for a search engine. */
  alt: string;
  /** Intrinsic aspect ratio, so a frame can reserve its box. */
  ratio: number;
  /** Whether light type can sit on it. */
  tone: PhotoTone;
  /** Widths actually emitted for this original. */
  widths: readonly number[];
  /** The width the single JPEG fallback was written at. */
  fallbackWidth: number;
};

/* Kept in source rather than read from the generated manifest at runtime: the
 * alt text is editorial copy and belongs under review, and a typed record is
 * what makes a missing photograph a build error instead of a broken frame. */
export const PHOTOS = {
  "downtown-aerial-night-trails": {
    slug: "downtown-aerial-night-trails",
    alt: "Downtown Dubai from the air at night, the Burj Khalifa lit above traffic running through the interchange below",
    ratio: 1.4993,
    tone: "dark",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "downtown-skyline-night": {
    slug: "downtown-skyline-night",
    alt: "The Downtown Dubai skyline after dark, the Burj Khalifa rising above the surrounding towers",
    ratio: 1.4993,
    tone: "dark",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "downtown-night-monochrome": {
    slug: "downtown-night-monochrome",
    alt: "Downtown Dubai at night in black and white, tower windows lit against an empty sky",
    ratio: 0.5627,
    tone: "dark",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "business-bay-dusk": {
    slug: "business-bay-dusk",
    alt: "Business Bay towers at dusk, reflected in the water of the canal",
    ratio: 0.5625,
    tone: "dark",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "burj-khalifa-dusk-silhouette": {
    slug: "burj-khalifa-dusk-silhouette",
    alt: "The Burj Khalifa in silhouette at dusk, birds crossing a warm sky",
    ratio: 0.5633,
    tone: "mixed",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "harbour-golden-hour": {
    slug: "harbour-golden-hour",
    alt: "The Dubai skyline at golden hour seen across a harbour of moored yachts",
    ratio: 1.3333,
    tone: "mixed",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "palm-jumeirah-dusk-aerial": {
    slug: "palm-jumeirah-dusk-aerial",
    alt: "Palm Jumeirah from the air at dusk, the fronds of villas lit against the sea",
    ratio: 0.75,
    tone: "mixed",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "palm-jumeirah-aerial-day": {
    slug: "palm-jumeirah-aerial-day",
    alt: "Palm Jumeirah from the air in daylight, the trunk road running out to the hotel at the crescent",
    ratio: 0.6667,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "dubai-marina-from-water": {
    slug: "dubai-marina-from-water",
    alt: "The towers of Dubai Marina seen across open water on a clear day",
    ratio: 1.4693,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "skyline-across-water-haze": {
    slug: "skyline-across-water-haze",
    alt: "The Dubai skyline in pale haze across the water, the Burj Khalifa faint at its centre",
    ratio: 1.5,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "downtown-fog-day": {
    slug: "downtown-fog-day",
    alt: "Downtown Dubai towers standing in morning fog",
    ratio: 0.5626,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "downtown-interchange-day": {
    slug: "downtown-interchange-day",
    alt: "The Burj Khalifa and Downtown Dubai seen from the interchange in daylight",
    ratio: 0.5625,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
  "burj-al-arab-cloud": {
    slug: "burj-al-arab-cloud",
    alt: "The Burj Al Arab seen through low cloud from above",
    ratio: 1.474,
    tone: "light",
    widths: [640, 1280, 1920, 2560],
    fallbackWidth: 1280,
  },
} as const satisfies Record<string, Photo>;

export type PhotoSlug = keyof typeof PHOTOS;

/** The `srcset` for one format, from the widths actually emitted. */
export function photoSrcSet(photo: Photo, format: "avif" | "webp"): string {
  return photo.widths.map((w) => `/photos/${photo.slug}-${w}.${format} ${w}w`).join(", ");
}

/** The single JPEG a browser with neither AVIF nor WebP will take. */
export function photoFallback(photo: Photo): string {
  return `/photos/${photo.slug}-${photo.fallbackWidth}.jpg`;
}

/**
 * Which photograph stands for which community.
 *
 * In source rather than in the database, because which frame belongs to which
 * community is a design decision made photograph by photograph, and an editor
 * swapping an area's hero image in the CMS should not silently re-cut the
 * homepage mosaic. Anything unmapped falls back to the city itself.
 *
 * One map, shared by the communities index and the homepage mosaic, so a
 * reader who scrolls the homepage and then opens the index sees the same
 * picture attached to the same place. The investment snapshot keeps its own,
 * for the documented reason that its card is a single large frame and wants
 * the wider crop of each community rather than the tighter one.
 */
const AREA_PHOTOS: Partial<Record<string, PhotoSlug>> = {
  "palm-jumeirah": "palm-jumeirah-aerial-day",
  "downtown-dubai": "downtown-skyline-night",
  "dubai-marina": "dubai-marina-from-water",
  "business-bay": "business-bay-dusk",
  "dubai-hills-estate": "harbour-golden-hour",
  "jumeirah-village-circle": "downtown-fog-day",
  "dubai-creek-harbour": "burj-khalifa-dusk-silhouette",
  "arabian-ranches": "skyline-across-water-haze",
  "damac-hills": "downtown-fog-day",
  "mohammed-bin-rashid-city": "downtown-interchange-day",
};

export function areaPhoto(slug: string): PhotoSlug {
  return AREA_PHOTOS[slug] ?? "downtown-skyline-night";
}
