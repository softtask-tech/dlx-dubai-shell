import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, absoluteUrl } from "@/config/site";

/**
 * Crawlers we name explicitly. Search engines index us; the AI answer engines
 * are how a growing share of buyers ask "who should I use in Dubai", CLAUDE.md
 * treats being readable by them as non-negotiable, so they are allowed by name
 * rather than left to the wildcard.
 */
const NAMED_AGENTS = [
  /* Search */
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Slurp",
  "Yandex",
  /* Social preview cards */
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "WhatsApp",
  /* AI answer engines and their crawlers */
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "meta-externalagent",
  "MistralAI-User",
] as const;

/** Only the canonical production origin should ever be indexed. */
function isProductionOrigin(requestUrl: string): boolean {
  try {
    return new URL(requestUrl).origin === new URL(SITE_URL).origin;
  } catch {
    return false;
  }
}

/**
 * /robots.txt, served dynamically so preview and staging deployments cannot be
 * indexed by accident, and so the sitemap always points at the canonical origin.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const body = isProductionOrigin(request.url)
          ? [
              ...NAMED_AGENTS.map((agent) => `User-agent: ${agent}\nAllow: /`),
              "User-agent: *\nAllow: /",
              `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
            ].join("\n\n")
          : "# Non-production origin, not for indexing.\nUser-agent: *\nDisallow: /";

        return new Response(`${body}\n`, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
