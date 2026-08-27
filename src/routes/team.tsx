import { createFileRoute } from "@tanstack/react-router";

import { listAgents } from "@/data/people";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { trackContactHref } from "@/components/site/contact-link";
import { Reveal } from "@/components/site/reveal";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/team")({
  loader: async () => ({ agents: await listAgents() }),
  head: () =>
    withHeroPreload(
      "palm-jumeirah-dusk-aerial",
      pageHead({ path: "/team", breadcrumbs: [{ name: "Team", path: "/team" }] }),
    ),
  component: TeamPage,
});

function TeamPage() {
  const { agents } = Route.useLoaderData();

  return (
    <>
      <PageHero
        photo="palm-jumeirah-dusk-aerial"
        title="The team."
        lead="A small team on purpose. You get a named consultant who stays with you from the first call to the last signature, not a rota, and not a call centre."
      />

      <Section>
        {agents.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <Eyebrow>Coming shortly</Eyebrow>
            <h2 className="display-3 mt-6">Consultant profiles are being prepared.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              In the meantime, an enquiry through any form on this site reaches a person, not a
              queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <Reveal key={agent.id} delay={stagger(index % 3)}>
                <article>
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {agent.photo_url ? (
                      <img
                        src={agent.photo_url}
                        alt={agent.full_name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <h2 className="display-3 mt-6">{agent.full_name}</h2>
                  {agent.job_title ? <p className="caption mt-1">{agent.job_title}</p> : null}
                  {agent.brn ? <p className="caption mt-3">RERA BRN {agent.brn}</p> : null}

                  {agent.bio ? (
                    <p className="body-text mt-5 text-muted-foreground">{agent.bio}</p>
                  ) : null}

                  {agent.specialities.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {agent.specialities.map((speciality) => (
                        <Tag key={speciality} variant="soft">
                          {speciality}
                        </Tag>
                      ))}
                    </div>
                  ) : null}

                  {agent.languages.length > 0 ? (
                    <p className="caption mt-5">Speaks {agent.languages.join(", ")}</p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                    {agent.email ? (
                      <a
                        href={`mailto:${agent.email}`}
                        className="eyebrow link-underline text-foreground"
                      >
                        Email
                      </a>
                    ) : null}
                    {agent.phone ? (
                      <a
                        href={`tel:${agent.phone}`}
                        onClick={() => trackContactHref(`tel:${agent.phone}`, `team-${agent.slug}`)}
                        className="eyebrow link-underline text-foreground"
                      >
                        Call
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
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <TrustStrip />
    </>
  );
}
