import { createFileRoute, Link } from "@tanstack/react-router";

import { brand } from "@/config/brand";
import { advisor } from "@/config/advisor";
import { pageHead } from "@/lib/seo";
import { Reveal } from "@/components/site/reveal";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * How we handle data.
 *
 * Written as a description of what this codebase actually does rather than as a
 * legal document, because CLAUDE.md forbids inventing legal specifics and a
 * privacy notice full of confident assertions nobody checked is worse than a
 * plain account of the mechanics. Every claim here is one the code can be read
 * against: these are the tags we load, this is when we load them, this is where
 * a lead goes.
 *
 * The page says plainly that it needs a lawyer's eye before launch.
 */
export const Route = createFileRoute("/privacy")({
  head: () => pageHead({ path: "/privacy", breadcrumbs: [{ name: "Data", path: "/privacy" }] }),
  component: PrivacyPage,
});

const SECTIONS: ReadonlyArray<{ heading: string; body: string[]; points?: string[] }> = [
  {
    heading: "What we collect, and when",
    body: [
      "Nothing identifies you until you tell us who you are. Reading the site, running a calculator or asking the advisor a question does not require a name, and we do not ask for one to let you do any of it.",
      "When you send an enquiry — through a form, the advisor, or by calling — we keep what you gave us and what you told us about what you are looking for, so a consultant can reply to the right person about the right thing.",
    ],
    points: [
      "Contact details you type: name, email address, phone number.",
      "What you told us: what you want to do, roughly when, and roughly what budget.",
      "How you arrived: the campaign, search or link that brought you here.",
      "The conversation itself, where you spoke to our AI advisor by chat or on the phone.",
    ],
  },
  {
    heading: "Cookies and advertising tags",
    body: [
      "We advertise, and advertising platforms want to know which of their clicks became enquiries. That measurement uses cookies, and it does not happen unless you accept it.",
      "Until you accept, the Meta and Google scripts are not loaded at all — not loaded and disabled, but absent from the page. If you decline, they stay absent.",
      "If you accept, we also send a copy of the conversion from our server, matched to the browser event so it is counted once rather than twice. Contact details in that copy are hashed before they are sent; we do not send your email address or phone number in the clear.",
    ],
  },
  {
    heading: "The AI advisor",
    body: [
      `${advisor.name} is software, not a person, and says so. Conversations are stored so a consultant can pick up where you left off and so we can check the advisor is answering properly.`,
      "A conversation only becomes an enquiry if you give a way to reply. Ask it not to, and it will not.",
    ],
  },
  {
    heading: "Who else sees it",
    body: [
      "Our own consultants, and the services that make the site work: our database and email provider, the AI model behind the advisor, and — if you have accepted advertising cookies — the ad platforms, in the hashed form described above.",
      "We do not sell data, and we do not pass enquiries to other brokerages.",
    ],
  },
  {
    heading: "Choosing differently",
    body: [
      "You can decline cookies, change your mind later, ask what we hold about you, ask us to correct it, or ask us to delete it. Any of those is an email away.",
      "Marketing emails carry an unsubscribe link that works immediately. Declining marketing does not stop a consultant replying to an enquiry you actually sent.",
    ],
  },
];

function PrivacyPage() {
  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Data</Eyebrow>
              <h1 className="display-1 mt-8">How we handle your information</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                Written plainly, and describing what the site actually does rather than what a
                template says it might.
              </p>
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-3">
            {SECTIONS.map((section) => (
              <Reveal
                key={section.heading}
                className="border-t border-border pt-10 pb-12 first:border-t-0 first:pt-0"
              >
                <h2 className="display-3">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="body-text mt-6 max-w-measure text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
                {section.points ? (
                  <ul className="mt-8 max-w-measure border-t border-border">
                    {section.points.map((point) => (
                      <li
                        key={point}
                        className="body-text flex gap-5 border-b border-border py-4 text-muted-foreground"
                      >
                        <span aria-hidden="true" className="text-accent">
                          —
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            ))}

            <Reveal>
              <p className="caption max-w-measure border-l-2 border-accent pl-6 text-muted-foreground">
                <span className="text-accent">
                  This is a description of practice, not legal advice.
                </span>{" "}
                It states accurately what the site does, and it needs review against UAE data
                protection law and against the rules of every market we advertise in before it is
                relied on as a formal notice.
              </p>
            </Reveal>

            <Reveal className="mt-12 border-t border-border pt-8">
              <p className="body-text text-muted-foreground">
                Questions about any of this, or a request about your own data:{" "}
                <a href={`mailto:${brand.contact.email}`} className="prose-link">
                  {brand.contact.email}
                </a>
                . {brand.name}, {brand.address.street}, {brand.address.locality} — RERA ORN{" "}
                {brand.reraOrn}. Our{" "}
                <Link to="/contact" className="prose-link">
                  contact page
                </Link>{" "}
                has the rest.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
