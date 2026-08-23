/**
 * Navigation labels, per language.
 *
 * The page registry owns the English label alongside the title and description,
 * because those three belong together. Translations do not live there: keeping
 * `pages.ts` import-free is what lets the OG generator and the sitemap script
 * load it under plain Node, and a registry carrying five languages of every
 * string would be a different, worse file.
 *
 * So the mapping is here instead, keyed by path. A page whose path is not
 * listed keeps its English label — which is correct, since it is an English
 * page.
 */
import type { Dictionary } from "./en";

const KEYS: Record<string, keyof Dictionary["nav"]> = {
  "/": "home",
  "/properties": "properties",
  "/services": "services",
  "/market-intelligence": "marketIntelligence",
  "/areas": "areas",
  "/tools": "tools",
  "/developers": "developers",
  "/team": "team",
  "/guides": "guides",
  "/blog": "blog",
  "/about": "about",
  "/privacy": "privacy",
  "/contact": "contact",
};

/** The label for a nav entry, in the reader's language where one exists. */
export function navLabel(path: string, t: Dictionary, fallback: string): string {
  const key = KEYS[path];
  return key ? t.nav[key] : fallback;
}
