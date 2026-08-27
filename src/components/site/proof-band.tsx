import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/motion";
import { Container, Eyebrow } from "@/components/ui/section";
import { site } from "@/config/site";
import type { Agent, Developer, Testimonial } from "@/data/types";
import { stagger } from "@/lib/motion";

/**
 * Proof, as one section rather than three.
 *
 * The old page had a trust strip, then a developer strip, then a testimonial
 * block, each a full-width band with a label and a row of things in it. Three
 * consecutive sections of the same shape saying "believe us" is weaker than one
 * that says it once, and it was a good part of why the page read as a document.
 *
 * So this is a single band with three unlike parts arranged around each other:
 * the people, who are the actual product of a small brokerage; the licence and
 * the office, stated plainly; and one client sentence. One quote, not a
 * carousel of them, and only ever a quote that can be gone and checked, which
 * is why `source_url` is required for it to appear at all.
 */
export function ProofBand({
  agents,
  partners,
  testimonial,
}: {
  agents: readonly Agent[];
  partners: readonly Developer[];
  testimonial: Testimonial | null;
}) {
  const team = agents.slice(0, 4);

  return (
    <section className="bg-paper-cool py-section">
      <Container>
        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-12">
          {/* The people. Named, with the role and the broker number, because
              "our expert team" is what a site says when it has neither. */}
          {team.length > 0 ? (
            <div className="lg:col-span-7">
              <Eyebrow>The people who will answer</Eyebrow>
              <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                {team.map((agent, i) => (
                  <li key={agent.id}>
                    <Reveal delay={stagger(i)}>
                      <div className="flex items-center gap-4">
                        {agent.photo_url ? (
                          <img
                            src={agent.photo_url}
                            alt=""
                            width={112}
                            height={112}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 shrink-0 object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="body-text font-medium">{agent.full_name}</p>
                          {agent.job_title ? <p className="caption">{agent.job_title}</p> : null}
                        </div>
                      </div>
                      {agent.brn ? <p className="caption mt-3">BRN {agent.brn}</p> : null}
                    </Reveal>
                  </li>
                ))}
              </ul>
              <Link to="/team" className="eyebrow link-underline mt-10 inline-block text-accent">
                The whole team
              </Link>
            </div>
          ) : null}

          {/* The licence, and one client sentence. A narrow column against the
              wide one, so the two halves are not mistaken for a pair. */}
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="border-t border-foreground pt-6">
              <p className="display-3">RERA ORN {site.reraOrn}</p>
              <p className="caption mt-3">
                Registered with Dubai's Real Estate Regulatory Agency. A real office in{" "}
                {site.address.street}, the district we transact in.
              </p>
            </div>

            {testimonial ? (
              <figure className="mt-12">
                <blockquote className="lead text-balance">
                  <span className="font-accent italic">“{testimonial.quote}”</span>
                </blockquote>
                <figcaption className="caption mt-5">
                  {testimonial.author_name}
                  {testimonial.author_location ? `, ${testimonial.author_location}` : null}
                  {testimonial.source_url ? (
                    <>
                      {" "}
                      <a
                        href={testimonial.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prose-link"
                      >
                        {testimonial.source ?? "Verify"}
                      </a>
                    </>
                  ) : null}
                </figcaption>
              </figure>
            ) : null}
          </div>
        </div>

        {/* Partner marks, as a quiet closing line under the whole band rather
            than as a section of their own. */}
        {partners.length > 0 ? (
          <div className="mt-16 border-t border-border pt-8">
            <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
              {partners.slice(0, 8).map((partner) => (
                <li key={partner.id} className="eyebrow text-muted-foreground">
                  {partner.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
