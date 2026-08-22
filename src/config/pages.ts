/**
 * The page registry — the authoritative list of indexable pages and the copy
 * that describes each one.
 *
 * Everything downstream reads from here: the header and footer navigation, the
 * per-page `<title>`/description/OG tags, breadcrumb schema, the sitemap, and
 * the OG card generator (`scripts/generate-og.mjs`, which imports this file
 * directly). A page that is not in this list is not navigable, not crawlable
 * and has no social card — which is the point: registering it is one step.
 *
 * Keep this file free of imports, aliases and `import.meta` so plain Node can
 * load it during the OG build.
 */

/** How often a page's content is expected to change, for the sitemap. */
export type ChangeFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type SitePage = {
  /** Route path, always starting with a slash. */
  path: string;
  /** Short label used in navigation and breadcrumbs. */
  label: string;
  /**
   * Page-specific `<title>`, before the brand suffix. Unique across the site —
   * two pages sharing a title is a bug, not a shortcut.
   */
  title: string;
  /** 150–160 characters of plain, useful language. Never keyword stuffing. */
  description: string;
  /** One editorial line. Rendered on the OG card and used as its alt text. */
  tagline: string;
  /** Use `title` verbatim instead of appending the brand suffix. */
  fullTitle?: boolean;
  /** Sitemap priority, 0–1. */
  priority: number;
  changeFrequency: ChangeFrequency;
};

export const SITE_PAGES: readonly SitePage[] = [
  {
    path: "/",
    label: "Home",
    title: "DLX Properties — Dubai real estate, handled with intention",
    description:
      "A private Dubai brokerage advising on prime residential acquisitions, off-market sales and long-term portfolio strategy. RERA ORN 40905.",
    tagline: "Dubai real estate, handled with intention.",
    fullTitle: true,
    priority: 1.0,
    changeFrequency: "weekly",
  },
  {
    path: "/properties",
    label: "Properties",
    title: "Properties",
    description:
      "Prime and off-market Dubai residences represented privately by DLX Properties — Palm Jumeirah, Downtown, Dubai Marina and the wider prime market.",
    tagline: "A curated portfolio, represented privately.",
    priority: 0.9,
    changeFrequency: "daily",
  },
  {
    path: "/services",
    label: "Services",
    title: "Services",
    description:
      "Acquisition, disposal, leasing and long-term portfolio advisory for private owners, family offices and first-time buyers into Dubai.",
    tagline: "Acquisition, disposal and portfolio strategy.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/market-intelligence",
    label: "Market Intelligence",
    title: "Dubai Market Intelligence",
    description:
      "Dubai transaction data, district analysis and quiet commentary on where value is moving — built on official Dubai Land Department records.",
    tagline: "Official Dubai data, read plainly.",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/tools",
    label: "Tools",
    title: "Calculators & Tools",
    description:
      "Work out the numbers before you commit — mortgage, rental yield, purchase costs and Golden Visa eligibility, in plain figures.",
    tagline: "Run the numbers before you commit.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/guides",
    label: "Guides",
    title: "Guides",
    description:
      "Practical guides to buying, owning and relocating to Dubai — written plainly for international buyers, investors and relocating families.",
    tagline: "Buying, owning and relocating — explained plainly.",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/about",
    label: "About",
    title: "About DLX",
    description:
      "DLX Properties is a private Dubai brokerage, RERA ORN 40905, built on restraint, discretion and client relationships measured in decades.",
    tagline: "A private brokerage, built on restraint.",
    priority: 0.6,
    changeFrequency: "yearly",
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact",
    description:
      "Speak with DLX Properties about acquiring, exiting or simply observing the Dubai market — a discreet, no-obligation conversation.",
    tagline: "Begin a quiet conversation.",
    priority: 0.7,
    changeFrequency: "yearly",
  },
];

/** Looks up a registered page. Throws loudly rather than shipping a page with no meta. */
export function pageFor(path: string): SitePage {
  const page = SITE_PAGES.find((p) => p.path === path);
  if (!page) {
    throw new Error(
      `No entry in SITE_PAGES for "${path}". Register the page in src/config/pages.ts so it gets meta tags, a social card and a sitemap entry.`,
    );
  }
  return page;
}

/** Derives the conventional OG image path for a route: "/" → "/og/home.png". */
export function ogImagePathFor(path: string): string {
  const slug = path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");
  return `/og/${slug}.png`;
}
