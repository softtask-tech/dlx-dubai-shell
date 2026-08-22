/**
 * Per-page head construction.
 *
 * CLAUDE.md treats SEO/AEO as non-negotiable: every page ships a unique title,
 * description, tagline, OG image and Twitter card, plus honest JSON-LD. This
 * module is the single way routes build that head, so no page can quietly fall
 * back to a global default.
 *
 * Usage inside a route:
 *
 *   export const Route = createFileRoute("/about")({
 *     head: () => pageHead({ path: "/about", breadcrumbs: [{ name: "About", path: "/about" }] }),
 *     component: AboutPage,
 *   });
 *
 * Title, description and tagline come from the page registry in
 * `src/config/pages.ts`; a route only passes what is specific to it.
 */
import { absoluteUrl, ogImagePathFor, SITE_PAGES, site } from "@/config/site";
import { breadcrumbSchema, type BreadcrumbEntry } from "@/lib/schema";

/** Open Graph images render at 1200×630 — the size every platform crops from. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

type JsonLd = Record<string, unknown>;

export type PageHeadInput = {
  /**
   * The page's own path, e.g. "/about" or "/services/buy". Drives the canonical
   * URL. When it matches a `SITE_PAGES` entry the copy is taken from there;
   * otherwise — a listing, a service, anything generated — pass the copy in.
   */
  path: string;
  /** Overrides the registered title. The brand suffix is appended unless `fullTitle`. */
  title?: string;
  /** Overrides the registered description. */
  description?: string;
  /** Overrides the registered tagline; also the OG image's alt text. */
  tagline?: string;
  /** Path to the page's own OG image. Defaults to the page's generated card. */
  image?: string;
  /** Use the title verbatim instead of appending " — DLX Properties". */
  fullTitle?: boolean;
  /** "article" for guides and market pieces; "website" otherwise. */
  type?: "website" | "article";
  /** Keep a page out of the index (thank-you pages, gated report bodies). */
  noIndex?: boolean;
  /** Breadcrumb trail beneath Home. Omit on the home page itself. */
  breadcrumbs?: readonly BreadcrumbEntry[];
  /** Any additional JSON-LD this page owns (FAQ, Article, Listing…). */
  schema?: readonly JsonLd[];
};

/**
 * Serialises a JSON-LD node for inline embedding.
 *
 * `<` is escaped so a string inside the data can never close the surrounding
 * script tag — the classic way inline JSON turns into an injection.
 */
function serializeJsonLd(node: JsonLd): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}

/** Builds the full head for a page: meta, canonical link and JSON-LD. */
export function pageHead(input: PageHeadInput) {
  const { path, image, type = "website", noIndex = false, breadcrumbs, schema = [] } = input;

  /*
   * Registered pages get their copy from the registry; generated pages pass it
   * in. Either way all three must exist — a page with no description or social
   * line is exactly what the SEO rules exist to prevent, so this throws rather
   * than quietly emitting a half-built head.
   */
  const registered = SITE_PAGES.find((page) => page.path === path);
  const title = input.title ?? registered?.title;
  const description = input.description ?? registered?.description;
  const tagline = input.tagline ?? registered?.tagline;
  const fullTitle = input.fullTitle ?? registered?.fullTitle ?? false;

  if (!title || !description || !tagline) {
    throw new Error(
      `pageHead("${path}") has no title, description or tagline. Either register the page in ` +
        "src/config/pages.ts or pass all three explicitly.",
    );
  }

  const resolvedTitle = fullTitle ? title : `${title} — ${site.name}`;
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image ?? ogImagePathFor(path));
  const imageAlt = tagline;

  const schemaNodes: JsonLd[] = [
    ...(breadcrumbs?.length ? [breadcrumbSchema(breadcrumbs)] : []),
    ...schema,
  ];

  return {
    meta: [
      { title: resolvedTitle },
      { name: "description", content: description },
      /* The page's editorial line — the same sentence the OG card renders. */
      { name: "tagline", content: tagline },
      {
        name: "robots",
        content: noIndex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },

      { property: "og:type", content: type },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: site.locale },
      { property: "og:url", content: canonical },
      { property: "og:title", content: resolvedTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
      { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
      { property: "og:image:alt", content: imageAlt },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: resolvedTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [{ rel: "canonical", href: canonical }],
    /* `head.scripts` renders inside <head> — the body-level list is a different option. */
    scripts: schemaNodes.map((node) => ({
      type: "application/ld+json",
      children: serializeJsonLd(node),
    })),
  };
}
