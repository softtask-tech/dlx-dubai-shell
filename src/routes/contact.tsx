import { createFileRoute } from "@tanstack/react-router";

import { site, SITE_URL } from "@/config/site";
import { listAgents, listTestimonials } from "@/data/people";
import { faqSchema, type FaqEntry } from "@/lib/schema";
import { pageHead, withHeroPreload } from "@/lib/seo";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { trackContactHref } from "@/components/site/contact-link";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { PageHero } from "@/components/site/page-hero";
import { Section, Eyebrow } from "@/components/ui/section";

const FAQS: readonly FaqEntry[] = [
  {
    question: "How quickly will someone come back to me?",
    answer:
      "Usually the same day, and always within one working day. A consultant reads your enquiry personally, nothing here goes into an automated sequence.",
  },
  {
    question: "Can I speak to someone before sharing my details?",
    answer:
      "Yes. Call or message us on WhatsApp and you will reach a person. The form is there because it saves you repeating yourself, not because we insist on it.",
  },
  {
    question: "Do you work with buyers outside the UAE?",
    answer:
      "Much of our client base is overseas. Viewings on video, due diligence and negotiation can all be handled remotely, and we will tell you before you commit if a step needs you here in person.",
  },
];

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const [agents, testimonials] = await Promise.all([listAgents(), listTestimonials(2)]);
    return { agents, testimonials };
  },
  head: () =>
    withHeroPreload(
      "dubai-marina-from-water",
      pageHead({
        path: "/contact",
        breadcrumbs: [{ name: "Contact", path: "/contact" }],
        schema: [
          faqSchema(FAQS),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            url: `${SITE_URL}/contact`,
            mainEntity: {
              "@type": "RealEstateAgent",
              name: site.name,
              email: site.contact.email,
              telephone: site.contact.phoneE164,
              address: {
                "@type": "PostalAddress",
                streetAddress: site.address.street,
                addressLocality: site.address.locality,
                addressCountry: site.address.country,
              },
            },
          },
        ],
      }),
    ),
  component: ContactPage,
});

/** Business Bay, roughly. Used for the embedded map. */
const MAP_BBOX = "55.2600,25.1780,55.2940,25.1940";

function ContactPage() {
  const { testimonials } = Route.useLoaderData();
  const whatsappNumber = site.contact.phoneE164.replace(/[^\d]/g, "");
  const whatsappText = encodeURIComponent(
    "Hello DLX, I'd like to speak to someone about Dubai property.",
  );

  return (
    <>
      <PageHero
        photo="dubai-marina-from-water"
        title="Begin a quiet conversation."
        lead="Whether you are acquiring, exiting or simply observing the market, we are available for a discreet, no-obligation discussion."
      />

      {/* Every route in, laid out plainly */}
      <Section className="pb-20">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <ContactRoute
            label="Call"
            value={site.contact.phone}
            href={`tel:${site.contact.phoneE164}`}
          >
            Business hours, Gulf Standard Time.
          </ContactRoute>
          <ContactRoute
            label="Email"
            value={site.contact.email}
            href={`mailto:${site.contact.email}`}
          >
            Read by a consultant, not a queue.
          </ContactRoute>
          <ContactRoute
            label="WhatsApp"
            value="Message us"
            href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
            external
          >
            Often the fastest way to reach us.
          </ContactRoute>
          <ContactRoute label="Office" value={`${site.address.street}, ${site.address.locality}`}>
            Visits by appointment.
          </ContactRoute>
        </div>
      </Section>

      {/* The form */}
      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Tell us what you need.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Three short steps. Only a way to reach you is required, everything else helps us
                come back to you with something useful rather than a brochure.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm sourceType="contact_form" sourceDetail="contact-page" />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Where we are */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>The office</Eyebrow>
              <h2 className="display-3 mt-6">{site.address.street}</h2>
              <p className="body-text mt-5 text-muted-foreground">
                {site.address.locality}, {site.address.countryName}
              </p>
              <p className="caption mt-6">RERA ORN {site.reraOrn}</p>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            <Reveal delay={0.1}>
              <div className="aspect-[16/9] w-full border border-border">
                <iframe
                  title={`Map showing ${site.name} in ${site.address.street}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${site.geo.latitude}%2C${site.geo.longitude}`}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Answer-shaped content, matching the FAQ schema */}
      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <h2 className="display-3">Asked and answered</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {FAQS.map((faq) => (
              <Reveal key={faq.question} className="border-t border-border last:border-b">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-7 [&::-webkit-details-marker]:hidden">
                    <h3 className="lead transition-colors group-open:text-accent">
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="eyebrow shrink-0 transition-transform duration-base ease-editorial group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="body-text max-w-measure pb-8 text-muted-foreground">{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TestimonialsBlock testimonials={testimonials} />
      <TrustStrip />
    </>
  );
}

function ContactRoute({
  label,
  value,
  href,
  external,
  children,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <Eyebrow>{label}</Eyebrow>
      <p className="display-3 mt-4">{value}</p>
      <p className="caption mt-3">{children}</p>
    </>
  );

  if (!href) return <div className="bg-background p-8">{body}</div>;

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => trackContactHref(href, "contact-page")}
      className="bg-background p-8 transition-colors duration-base ease-editorial hover:bg-secondary"
    >
      {body}
    </a>
  );
}
