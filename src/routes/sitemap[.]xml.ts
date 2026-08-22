import { createFileRoute } from "@tanstack/react-router";

import { SITE_PAGES, absoluteUrl } from "@/config/site";
import { listDeveloperSlugs, listProjectSlugs } from "@/data/catalogue";
import { GUIDES } from "@/data/guides";
import { listAreasWithStats } from "@/data/market";
import { listPropertySlugs } from "@/data/properties";
import { SERVICES } from "@/data/services";
import { TOOLS } from "@/data/tools";

/** Escapes the five XML entities so a URL can never break the document. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * /sitemap.xml — generated from the page registry in `src/config/site.ts`, so a
 * page becomes crawlable the moment it is registered rather than whenever
 * someone remembers to update a static file.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const lastModified = new Date().toISOString().slice(0, 10);

        /*
         * Registered pages plus everything generated. The database queries run
         * with the publishable key, so unpublished listings never reach the
         * sitemap — the same rule that hides them from the site hides them here.
         * If Supabase is unreachable the sitemap still ships the static pages
         * rather than failing: a partial sitemap beats a 500.
         */
        const [propertySlugs, developerSlugs, projectSlugs, areas] = await Promise.all([
          listPropertySlugs().catch(() => [] as string[]),
          listDeveloperSlugs().catch(() => [] as string[]),
          listProjectSlugs().catch(() => [] as string[]),
          listAreasWithStats().catch(() => []),
        ]);

        type Entry = {
          path: string;
          changefreq: string;
          priority: number;
          /** Overrides today's date where the content has a real review date. */
          lastmod?: string;
        };

        const entries: Entry[] = [
          ...SITE_PAGES.map((page) => ({
            path: page.path,
            changefreq: page.changeFrequency,
            priority: page.priority,
          })),
          ...SERVICES.map((service) => ({
            path: `/services/${service.slug}`,
            changefreq: "monthly",
            priority: 0.8,
          })),
          ...TOOLS.map((tool) => ({
            path: `/tools/${tool.slug}`,
            changefreq: "monthly",
            priority: 0.7,
          })),
          /* Guides carry their own review date, which is the honest lastmod —
           * claiming today's date on an article reviewed in March is exactly the
           * kind of freshness signal Google discounts. */
          ...GUIDES.map((guide) => ({
            path: `/guides/${guide.slug}`,
            changefreq: "monthly",
            priority: 0.7,
            lastmod: guide.reviewedOn,
          })),
          ...propertySlugs.map((slug) => ({
            path: `/properties/${slug}`,
            changefreq: "weekly",
            priority: 0.8,
          })),
          ...developerSlugs.map((slug) => ({
            path: `/developers/${slug}`,
            changefreq: "monthly",
            priority: 0.6,
          })),
          ...projectSlugs.map((slug) => ({
            path: `/projects/${slug}`,
            changefreq: "weekly",
            priority: 0.7,
          })),
          /* Community pages carry the market data, so they are worth crawling
           * often — they change whenever the statistics are recomputed. */
          ...areas.map((area) => ({
            path: `/areas/${area.slug}`,
            changefreq: "weekly",
            priority: 0.8,
          })),
        ];

        const urls = entries
          .map(
            (entry) => `  <url>
    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>
    <lastmod>${entry.lastmod ?? lastModified}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
