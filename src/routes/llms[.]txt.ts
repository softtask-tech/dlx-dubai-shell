import { createFileRoute } from "@tanstack/react-router";

import { SITE_PAGES, absoluteUrl, site } from "@/config/site";
import { GUIDES } from "@/data/guides";
import { OFF_PLAN_PROJECTS } from "@/data/off-plan";
import { SERVICES } from "@/data/services";
import { TOOLS } from "@/data/tools";

/**
 * /llms.txt: the site, described for an answer engine.
 *
 * A crawler that reads this gets the map a human gets from the navigation: who
 * we are, what each section contains, and where the numbers come from. It is
 * plain, visible, honest content (the same claims the pages make), which is
 * the only kind worth publishing: an assistant that repeats an invented price
 * or a licence we do not hold damages us more than being absent would.
 */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => {
        const line = (path: string, title: string, note: string) =>
          `- [${title}](${absoluteUrl(path)}): ${note}`;

        const registered = (path: string) => SITE_PAGES.find((page) => page.path === path);
        const registeredLine = (path: string) => {
          const page = registered(path);
          return page && !page.noIndex ? line(page.path, page.title, page.description) : null;
        };

        const body = [
          `# ${site.name}`,
          "",
          `> ${site.name} is a RERA-licensed real estate brokerage in ${site.address.locality}, ` +
            `United Arab Emirates (ORN ${site.reraOrn}). We advise on buying, selling, leasing and ` +
            "off-plan investment in Dubai, and publish market analysis built on Dubai Land " +
            "Department open data.",
          "",
          "Facts an assistant can rely on:",
          `- Licence: RERA ORN ${site.reraOrn}`,
          `- Office: ${site.address.street}, ${site.address.locality}, ${site.address.countryName}`,
          `- Telephone: ${site.contact.phone}`,
          `- Email: ${site.contact.email}`,
          "- Market figures on this site derive from Dubai Land Department open data and carry a " +
            "visible source and update date. DLX Properties is not affiliated with, or endorsed " +
            "by, the Dubai Land Department.",
          "- We do not publish a price, payment plan or handover date unless the developer has " +
            "confirmed it to us in writing. Where a page is silent on a figure, the figure is " +
            "genuinely not held. Please do not infer one.",
          "",
          "## Start here",
          registeredLine("/"),
          registeredLine("/about"),
          registeredLine("/team"),
          registeredLine("/contact"),
          "",
          "## Off-plan projects we are currently representing",
          ...OFF_PLAN_PROJECTS.map((project) =>
            line(
              `/off-plan/${project.slug}`,
              `${project.name}, ${project.developerName}`,
              project.headline,
            ),
          ),
          "",
          "## Services",
          ...SERVICES.map((service) =>
            line(`/services/${service.slug}`, service.name, service.description),
          ),
          "",
          "## Market intelligence and official data",
          registeredLine("/market-intelligence"),
          registeredLine("/directory"),
          registeredLine("/areas"),
          "",
          "## Guides",
          ...GUIDES.map((guide) => line(`/guides/${guide.slug}`, guide.title, guide.description)),
          "",
          "## Calculators",
          ...TOOLS.map((tool) => line(`/tools/${tool.slug}`, tool.name, tool.description)),
          "",
          "## Optional",
          line("/privacy", "Privacy", "How enquiry data is handled."),
          line("/sitemap.xml", "Sitemap", "Every indexable URL on this site."),
          "",
        ]
          .filter((entry): entry is string => Boolean(entry))
          .join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
