import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";

import type { Agent } from "@/data/types";
import { listAgents } from "@/data/people";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { teamListSchema } from "@/lib/schema";
import { trackContactHref } from "@/components/site/contact-link";
import { ConsultantPortrait } from "@/components/site/consultant-portrait";
import { MaskReveal, Reveal } from "@/components/motion";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { SectionOpener } from "@/components/site/section-opener";
import { Section, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  loader: async () => ({ agents: await listAgents() }),
  head: ({ loaderData }) =>
    withHeroPreload(
      "palm-jumeirah-dusk-aerial",
      pageHead({
        path: "/team",
        breadcrumbs: [{ name: "Team", path: "/team" }],
        schema: loaderData?.agents?.length
          ? [
              teamListSchema(
                loaderData.agents.map((agent) => ({ slug: agent.slug, name: agent.full_name })),
              ),
            ]
          : [],
      }),
    ),
  component: TeamPage,
});

/**
 * The people, one at a time.
 *
 * This was a three-column grid of text blocks with a small portrait above
 * each. A grid is what you use when the reader's job is to scan and pick, and
 * that is the wrong job here: nobody arrives at a four-person team page to
 * filter it. They arrive to find out whether these are people they would trust
 * with a large sum of money, and a directory cell cannot answer that.
 *
 * So each consultant takes a full row, portrait at a size you can actually
 * read a face in, and their own sentence set as a quote rather than as body
 * copy. Every bio here is written in the first person, which the old layout
 * flattened into grey paragraph text; setting it in the display face is the
 * single cheapest thing on this site that makes it feel like it was made by
 * people. The sides alternate so the page has a rhythm rather than a repeat.
 *
 * The portrait frame is the same one `ConsultantPortrait` draws its initials
 * into, so the photographs drop in when they arrive and nothing moves.
 */
/**
 * Small counts read better as words in a headline, and worse as words once
 * they stop being small. Ten is where the line falls: "Twelve people" is
 * fine in prose and heavy in display type.
 */
const COUNT_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
] as const;

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

function TeamPage() {
  const { agents } = Route.useLoaderData();

  return (
    <>
      <PageHero
        photo="palm-jumeirah-dusk-aerial"
        title="The team."
        lead="A small team on purpose. You get a named consultant who stays with you from the first call to the last signature, not a rota, and not a call centre."
      />

      {agents.length === 0 ? (
        <Section>
          <div className="border border-border p-12 text-center">
            <Eyebrow>Coming shortly</Eyebrow>
            <h2 className="display-3 mt-6">Consultant profiles are being prepared.</h2>
            <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
              In the meantime, an enquiry through any form on this site reaches a person, not a
              queue.
            </p>
          </div>
        </Section>
      ) : (
        <Section>
          {/*
           * The count is derived, not typed.
           *
           * This headline said "Four people" while the rows beneath it were
           * rendered from whatever `listAgents()` returned. Hire a fifth and
           * the page contradicts itself in the same screenful — which is the
           * worst kind of wrong, because the reader can see the evidence
           * against it without scrolling. The About page already derives the
           * same figure; this one had it typed in.
           */}
          <SectionOpener
            eyebrow="Who you will be dealing with"
            title={
              agents.length === 1
                ? "One person, and they stay with you from first call to last signature."
                : `${countWord(agents.length)} people, and the one who answers is the one who stays.`
            }
          />
          <div className="mt-16 flex flex-col gap-20 md:gap-28">
            {agents.map((agent, index) => (
              <ConsultantRow key={agent.id} agent={agent} flipped={index % 2 === 1} />
            ))}
          </div>
        </Section>
      )}

      <TrustStrip />
    </>
  );
}

function ConsultantRow({ agent, flipped }: { agent: Agent; flipped: boolean }) {
  const contacts = [
    agent.email
      ? { href: `mailto:${agent.email}`, label: "Email", Icon: Mail, track: `mailto:${agent.email}` }
      : null,
    agent.phone
      ? { href: `tel:${agent.phone}`, label: "Call", Icon: Phone, track: `tel:${agent.phone}` }
      : null,
    agent.whatsapp
      ? {
          href: `https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`,
          label: "WhatsApp",
          Icon: MessageCircle,
          track: "wa.me",
        }
      : null,
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <MaskReveal className={cn("lg:col-span-5", flipped && "lg:order-2 lg:col-start-8")}>
        <Link
          to="/team/$slug"
          params={{ slug: agent.slug }}
          tabIndex={-1}
          aria-hidden="true"
          className="focus-ring group block overflow-hidden"
        >
          <ConsultantPortrait
            agent={agent}
            className="transition-transform duration-cinematic ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </Link>
      </MaskReveal>

      <div className={cn("lg:col-span-6", flipped && "lg:order-1 lg:col-start-1")}>
        <Reveal>
          {agent.job_title ? <Eyebrow>{agent.job_title}</Eyebrow> : null}
          <h2 className="display-2 mt-4">
            <Link
              to="/team/$slug"
              params={{ slug: agent.slug }}
              className="focus-ring transition-colors hover:text-gold-ink"
            >
              {agent.full_name}
            </Link>
          </h2>
          {agent.brn ? (
            <p className="eyebrow mt-4 inline-block bg-cream px-2.5 py-1 text-gold-ink">
              RERA BRN {agent.brn}
            </p>
          ) : null}
        </Reveal>

        {/* Their own words, set as words rather than as a paragraph of grey. */}
        {agent.bio ? (
          <Reveal delay={0.08}>
            <blockquote className="mt-8 border-s-2 border-gold-ink ps-6">
              <p className="font-display text-xl leading-snug text-balance sm:text-2xl">
                {agent.bio}
              </p>
            </blockquote>
          </Reveal>
        ) : null}

        <Reveal delay={0.12}>
          {agent.specialities.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {agent.specialities.map((speciality) => (
                <Tag key={speciality} variant="soft">
                  {speciality}
                </Tag>
              ))}
            </div>
          ) : null}

          {agent.languages.length > 0 ? (
            <p className="caption mt-6 text-muted-foreground">
              Speaks {agent.languages.join(", ")}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {contacts.map(({ href, label, Icon, track }) => (
              <a
                key={label}
                href={href}
                {...(label === "WhatsApp"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                onClick={() => trackContactHref(track, `team-${agent.slug}`)}
                className="focus-ring eyebrow inline-flex min-h-11 items-center gap-2 border border-border px-4 text-foreground transition-colors hover:border-gold-ink hover:text-gold-ink"
              >
                <Icon aria-hidden className="size-3.5" />
                {label}
              </a>
            ))}
            <Link
              to="/team/$slug"
              params={{ slug: agent.slug }}
              className="focus-ring eyebrow group inline-flex min-h-11 items-center gap-2 text-gold-ink"
            >
              Full profile
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform duration-quick ease-editorial group-hover:translate-x-1 rtl:-scale-x-100"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
