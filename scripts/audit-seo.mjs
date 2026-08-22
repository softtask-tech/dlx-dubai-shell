/**
 * Audits the SEO/AEO rules that CLAUDE.md calls non-negotiable, against a
 * running server rather than against the source — which is the only way to
 * catch a page that renders a different head from the one it declares.
 *
 *   npm run dev
 *   node scripts/audit-seo.mjs                  # defaults to the dev server
 *   node scripts/audit-seo.mjs http://host:port
 *
 * It crawls every URL in `/sitemap.xml` and checks that each one has:
 *
 *   * a title, description, og:image, twitter:card and canonical;
 *   * a title, description and og:image that no other page shares — a shared
 *     description across ten pages is the single most common way a site with
 *     good content ranks badly; and
 *   * at least one parseable JSON-LD block.
 *
 * Exits non-zero on any failure, so it can gate a deploy.
 */

const BASE = (process.argv[2] ?? "http://127.0.0.1:4173").replace(/\/$/, "");

const REQUIRED = {
  title: /<title>([^<]*)<\/title>/,
  description: /name="description" content="([^"]*)"/,
  image: /property="og:image" content="([^"]*)"/,
  twitter: /name="twitter:card" content="([^"]*)"/,
  canonical: /rel="canonical" href="([^"]*)"/,
};

/** These must be unique across the site, not merely present. */
const UNIQUE = ["title", "description", "image"];

/** Collects every `@type` in a JSON-LD tree, including array-valued ones. */
function collectTypes(node, into) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, into);
    return into;
  }
  if (node && typeof node === "object") {
    const type = node["@type"];
    if (typeof type === "string") into.add(type);
    else if (Array.isArray(type))
      for (const one of type) if (typeof one === "string") into.add(one);
    for (const value of Object.values(node)) collectTypes(value, into);
  }
  return into;
}

async function main() {
  const response = await fetch(`${BASE}/sitemap.xml`);
  if (!response.ok) throw new Error(`No sitemap at ${BASE}/sitemap.xml (HTTP ${response.status})`);

  const paths = [...(await response.text()).matchAll(/<loc>([^<]*)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );

  const problems = [];
  const firstSeen = Object.fromEntries(UNIQUE.map((key) => [key, new Map()]));
  const schemaCounts = new Map();

  for (const path of paths) {
    const page = await fetch(BASE + path);
    if (!page.ok) {
      problems.push(`${path}: HTTP ${page.status}`);
      continue;
    }
    const html = await page.text();

    for (const [key, pattern] of Object.entries(REQUIRED)) {
      const value = html.match(pattern)?.[1];
      if (!value) {
        problems.push(`${path}: missing ${key}`);
        continue;
      }
      if (!UNIQUE.includes(key)) continue;

      const seen = firstSeen[key];
      if (seen.has(value)) problems.push(`${path}: ${key} duplicates ${seen.get(value)}`);
      else seen.set(value, path);
    }

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    if (blocks.length === 0) {
      problems.push(`${path}: no JSON-LD`);
      continue;
    }
    const types = new Set();
    for (const [, json] of blocks) {
      try {
        /* `serializeJsonLd` escapes `<` so a payload can never close the tag. */
        collectTypes(JSON.parse(json.replaceAll("\\u003c", "<")), types);
      } catch (error) {
        problems.push(`${path}: unparseable JSON-LD — ${error.message}`);
      }
    }
    for (const type of types) schemaCounts.set(type, (schemaCounts.get(type) ?? 0) + 1);
  }

  console.log(`Audited ${paths.length} URLs from ${BASE}/sitemap.xml\n`);
  console.log("Schema coverage:");
  for (const [type, count] of [...schemaCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(18)} ${count}`);
  }

  if (problems.length === 0) {
    console.log(
      "\n✓ Every page has a unique title, description and social card, and valid JSON-LD.",
    );
    return;
  }

  console.log(`\n✗ ${problems.length} problems:`);
  for (const problem of problems) console.log(`  ${problem}`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
