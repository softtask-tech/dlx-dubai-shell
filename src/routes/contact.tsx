import { Link, createFileRoute } from "@tanstack/react-router";

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
import { cn } from "@/lib/utils";
import { Section, Eyebrow } from "@/components/ui/section";
import { SectionOpener } from "@/components/site/section-opener";

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

/** Dubai Investment Park First, roughly. Used for the embedded map. */
const MAP_BBOX = "55.1560,24.9760,55.1880,24.9960";

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
        title="Tell us what you are trying to do."
        lead="One consultant reads it and comes back with something useful: what is actually available, what it should cost you, and what we would do in your position. No obligation, and no brochure."
      />

      {/*
       * Four ways in, weighted by the one that works.
       *
       * These were four equal tiles, which says the four are equally good.
       * They are not: a call gets an answer in a minute and a form gets one
       * when somebody next opens it, and the whole page exists to start a
       * conversation. So the phone number is twice the width and set on the
       * green, the two quick written routes sit beside it, and the office
       * address runs underneath as a line rather than pretending to be a
       * fourth call to action. Nobody clicks an address.
       */}
      <Section className="pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ContactRoute
            primary
            label="Call"
            value={site.contact.phone}
            href={`tel:${site.contact.phoneE164}`}
          >
            Business hours, Gulf Standard Time. Usually answered inside a minute.
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
          <ContactRoute
            wide
            label="Office"
            value={`${site.address.street}, ${site.address.locality}`}
          >
            Visits by appointment.
          </ContactRoute>
        </div>
      </Section>

      {/* The form */}
      <Section data-surface="cream">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionOpener
              eyebrow="Send it over"
              title="Tell us what you need."
              align="split"
              lead="Three short steps. Only a way to reach you is required; everything else helps us come back with something useful rather than a brochure."
            />
            <Reveal delay={0.2}>
              <p className="caption mt-8 text-muted-foreground">
                It reaches a named consultant, not a queue.{" "}
                <Link to="/team" className="link-underline text-gold-ink">
                  See who answers
                </Link>
                .
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
              <h2 className="display-3 mt-5">{site.address.street}</h2>
              <p className="body-text mt-5 text-muted-foreground">
                {site.address.locality}, {site.address.countryName}
              </p>
              <p className="eyebrow mt-6 flex items-center gap-2.5 text-foreground">
                <span aria-hidden className="inline-block size-1 shrink-0 bg-gold-ink" />
                Visits by appointment
              </p>
              <p className="caption mt-6">
                Corporate registration details are available in the legal disclosure and on
                applicable property advertising.
              </p>
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
      <Section data-surface="cream">
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
  primary,
  wide,
  children,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  /** The one route the page is actually for. Set on the green, double width. */
  primary?: boolean;
  /** Runs the full width as a line rather than sitting as a fourth tile. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const span = primary ? "sm:col-span-2" : wide ? "sm:col-span-2 lg:col-span-4" : "";
  const skin = primary
    ? "border-green bg-green text-on-dark hover:border-gold"
    : "border-border bg-paper hover:border-gold";

  const body = (
    <>
      <Eyebrow className={primary ? "text-gold" : undefined}>{label}</Eyebrow>
      <p className={cn("mt-4", primary ? "display-2" : "display-3")} dir={primary ? "ltr" : undefined}>
        {value}
      </p>
      <p className={cn("caption mt-3", primary && "text-on-dark-muted")}>{children}</p>
    </>
  );

  if (!href) {
    return <div className={cn("border p-7", span, skin)}>{body}</div>;
  }

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => trackContactHref(href, "contact-page")}
      className={cn(
        "focus-ring group block border p-7 transition-[border-color,transform,box-shadow] duration-quick ease-editorial",
        "hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.07)]",
        span,
        skin,
      )}
    >
      {body}
    </a>
  );
}
