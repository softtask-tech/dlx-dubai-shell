import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { ConsultantEnquiry } from "@/components/forms/consultant-enquiry";
import { ConsultantPortrait } from "@/components/site/consultant-portrait";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { trackContactHref } from "@/components/site/contact-link";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { getAgent } from "@/data/people";
import { pageHead } from "@/lib/seo";
import { personSchema } from "@/lib/schema";

export const Route = createFileRoute("/team/$slug")({
  loader: async ({ params }) => {
    const agent = await getAgent(params.slug);
    if (!agent || !agent.is_active) throw notFound();
    return { agent };
  },
  head: ({ loaderData }) => {
    const agent = loaderData?.agent;
    if (!agent) {
      return { meta: [{ title: "Consultant unavailable" }, { name: "robots", content: "noindex" }] };
    }

    const role = agent.job_title ?? "Property consultant";
    return pageHead({
      path: `/team/${agent.slug}`,
      title: `${agent.full_name}, ${role}`,
      fullTitle: true,
      description:
        agent.bio?.slice(0, 300) ??
        `${agent.full_name} is a ${role.toLowerCase()} at DLX Properties in Dubai${
          agent.brn ? `, RERA BRN ${agent.brn}` : ""
        }.`,
      tagline: `${role} at DLX Properties.`,
      image: "/og/team.png",
      breadcrumbs: [
        { name: "Team", path: "/team" },
        { name: agent.full_name, path: `/team/${agent.slug}` },
      ],
      schema: [
        personSchema({
          slug: agent.slug,
          name: agent.full_name,
          jobTitle: agent.job_title,
          description: agent.bio,
          image: agent.photo_url,
          email: agent.email,
          telephone: agent.phone,
          brn: agent.brn,
          languages: agent.languages,
          specialities: agent.specialities,
          sameAs: agent.linkedin_url ? [agent.linkedin_url] : [],
        }),
      ],
    });
  },
  component: ConsultantPage,
});

function ConsultantPage() {
  const { agent } = Route.useLoaderData();

  return (
    <>
      <Section>
        <Link to="/team" className="eyebrow link-underline text-muted-foreground">
          ← The team
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Reveal>
            <ConsultantPortrait agent={agent} eager />
          </Reveal>

          <Reveal delay={0.05}>
            <div>
              <h1 className="display-1 text-balance">{agent.full_name}</h1>
              {agent.job_title ? <p className="lead mt-4">{agent.job_title}</p> : null}
              {agent.brn ? <p className="caption mt-4">RERA BRN {agent.brn}</p> : null}

              {agent.bio ? (
                <p className="body-text mt-8 max-w-measure text-muted-foreground">{agent.bio}</p>
              ) : null}

              {agent.specialities.length > 0 ? (
                <div className="mt-8">
                  <Eyebrow>Works on</Eyebrow>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {agent.specialities.map((speciality) => (
                      <Tag key={speciality} variant="soft">
                        {speciality}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : null}

              {agent.languages.length > 0 ? (
                <div className="mt-8">
                  <Eyebrow>Speaks</Eyebrow>
                  <p className="body-text mt-3">{agent.languages.join(", ")}</p>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                {agent.phone ? (
                  <a
                    href={`tel:${agent.phone}`}
                    onClick={() => trackContactHref(`tel:${agent.phone}`, `team-${agent.slug}`)}
                    className="eyebrow link-underline text-foreground"
                  >
                    Call {agent.phone}
                  </a>
                ) : null}
                {agent.whatsapp ? (
                  <a
                    href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`}
                    onClick={() => trackContactHref("wa.me", `team-${agent.slug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow link-underline text-foreground"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {agent.email ? (
                  <a
                    href={`mailto:${agent.email}`}
                    className="eyebrow link-underline text-foreground"
                  >
                    {agent.email}
                  </a>
                ) : null}
                {agent.linkedin_url ? (
                  <a
                    href={agent.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow link-underline text-foreground"
                  >
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 max-w-3xl">
          <ConsultantEnquiry agent={agent} />
        </div>
      </Section>

      <TrustStrip />
    </>
  );
}
