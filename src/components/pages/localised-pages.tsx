import { useLocale, useT } from "@/i18n";
import { EnglishOnly, EnglishOnlyNotice } from "@/i18n/english-only";
import { stagger } from "@/lib/motion";
import { site } from "@/config/site";
import { SERVICES } from "@/data/services";
import { TOOL_CATEGORIES, TOOLS } from "@/data/tools";
import type { Developer, Testimonial } from "@/data/types";
import { CurrencyPicker } from "@/components/tools/money";
import { DeveloperStrip } from "@/components/site/developer-strip";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Reveal } from "@/components/site/reveal";
import { TestimonialsBlock } from "@/components/site/testimonials-block";
import { TrustStrip } from "@/components/site/trust-strip";
import { Button } from "@/components/ui/button";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * The four localised pages beyond the homepage.
 *
 * They share a shape on purpose — a tall opening spread, an argument, the
 * credentials line, a close — because the whole point of translating only five
 * pages is that those five have to feel like one publication rather than five
 * leaflets. Every primitive here is the same one the English pages use, so the
 * typography, rhythm and motion are identical and only the words differ.
 *
 * The service and tool *names* stay English throughout. They are the labels on
 * pages that are themselves in English, and a reader who follows a translated
 * link to an English page they were not warned about concludes the site is
 * broken. Marked with EN instead, which is what a newspaper does.
 */

/** The tall opening spread every localised page shares. */
function PageOpening({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <Section className="pt-44 pb-20 lg:pt-56">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display-1 mt-8">{title}</h1>
          </Reveal>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal delay={0.12}>
            <p className="body-text text-muted-foreground">{lead}</p>
            <div className="mt-10 h-px w-16 bg-accent" />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

export function LocalisedAbout({
  testimonials,
  partners,
}: {
  testimonials: readonly Testimonial[];
  partners: readonly Developer[];
}) {
  const { t, code, pathIn } = useLocale();

  return (
    <>
      <PageOpening eyebrow={t.about.eyebrow} title={t.about.title} lead={t.about.lead} />

      <Section className="pt-0 pb-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>{t.about.licenceEyebrow}</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            <Reveal delay={0.1}>
              <p className="lead">{t.about.licenceBody}</p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Reveal>
              <Eyebrow>{t.about.principlesEyebrow}</Eyebrow>
            </Reveal>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            {t.about.principles.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={stagger(index)}
                className="border-t border-border/60 py-8 first:border-0 first:pt-0"
              >
                <div>
                  <h2 className="display-3">{principle.title}</h2>
                  <p className="body-text mt-4 max-w-measure text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <TrustStrip />
      <DeveloperStrip developers={partners} />
      <TestimonialsBlock testimonials={testimonials} />

      <Section className="pt-0">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="display-2">{t.about.ctaTitle}</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">{t.about.ctaBody}</p>
              <a href={pathIn(code, "/contact")} className="mt-10 inline-block">
                <Button>{t.about.ctaButton}</Button>
              </a>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}

export function LocalisedServices() {
  const { t, code, dir, pathIn } = useLocale();
  const nudge = dir === "rtl" ? "group-hover:-translate-x-3" : "group-hover:translate-x-3";

  return (
    <>
      <PageOpening eyebrow={t.services.eyebrow} title={t.services.title} lead={t.services.lead} />

      <Section className="pt-0">
        <EnglishOnlyNotice className="mb-12" />
        <div className="hairline" />
        {SERVICES.map((service, index) => (
          <Reveal key={service.slug} delay={stagger(index)}>
            <a
              href={`/services/${service.slug}`}
              className="group grid items-baseline gap-4 border-b border-border py-10 transition-colors hover:border-accent md:grid-cols-12"
            >
              <span className="eyebrow md:col-span-1">{String(index + 1).padStart(2, "0")}</span>
              <span
                lang="en"
                dir="ltr"
                className={`display-3 transition-transform duration-slow ease-editorial ${nudge} md:col-span-5`}
              >
                {service.name}
              </span>
              <span lang="en" dir="ltr" className="body-text text-muted-foreground md:col-span-5">
                {service.tagline}
              </span>
              <span className="eyebrow transition-colors group-hover:text-accent md:col-span-1 md:text-end">
                {t.services.detailLink}
                <EnglishOnly />
              </span>
            </a>
          </Reveal>
        ))}
      </Section>

      <TrustStrip />

      <Section className="pt-0">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="display-2">{t.services.ctaTitle}</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">{t.services.ctaBody}</p>
              <a href={pathIn(code, "/contact")} className="mt-10 inline-block">
                <Button>{t.services.ctaButton}</Button>
              </a>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}

export function LocalisedTools() {
  const { t, code, pathIn } = useLocale();

  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>{t.tools.eyebrow}</Eyebrow>
              <h1 className="display-1 mt-8">{t.tools.title}</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">{t.tools.lead}</p>
              {/* The picker belongs here rather than in the header alone: this
                  is the page where someone is about to read a lot of figures. */}
              <CurrencyPicker className="mt-10" />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <aside className="border-s-2 border-accent bg-secondary/60 px-6 py-5">
          <p className="eyebrow">{t.tools.noteTitle}</p>
          <p className="body-text mt-3 max-w-measure text-muted-foreground">{t.tools.noteBody}</p>
          <a
            href={pathIn(code, "/contact")}
            className="eyebrow link-underline mt-4 inline-block text-accent"
          >
            {t.tools.ctaButton}
          </a>
        </aside>
      </Section>

      {TOOL_CATEGORIES.map((category) => {
        const tools = TOOLS.filter((tool) => tool.category === category);
        if (tools.length === 0) return null;

        return (
          <Section key={category} className="pt-0">
            <Reveal>
              <Eyebrow lang="en" dir="ltr">
                {category}
              </Eyebrow>
            </Reveal>
            <div className="mt-8">
              <div className="hairline" />
              {tools.map((tool, index) => (
                <Reveal key={tool.slug} delay={stagger(index)}>
                  <a
                    href={`/tools/${tool.slug}`}
                    className="group grid gap-5 border-b border-border py-10 transition-colors hover:border-accent lg:grid-cols-12"
                  >
                    <div className="lg:col-span-4">
                      <h2
                        lang="en"
                        dir="ltr"
                        className="display-3 transition-colors group-hover:text-accent"
                      >
                        {tool.name}
                      </h2>
                      <p lang="en" dir="ltr" className="caption mt-4 text-muted-foreground">
                        {tool.question}
                      </p>
                    </div>
                    <p
                      lang="en"
                      dir="ltr"
                      className="body-text text-muted-foreground lg:col-span-5 lg:col-start-6"
                    >
                      {tool.answer}
                    </p>
                    <span className="eyebrow lg:col-span-2 lg:col-start-11 lg:text-end">
                      {t.tools.openTool}
                      <EnglishOnly />
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </Section>
        );
      })}

      <TrustStrip className="pt-0" />
    </>
  );
}

export function LocalisedContact() {
  const t = useT();

  return (
    <>
      <PageOpening eyebrow={t.contact.eyebrow} title={t.contact.title} lead={t.contact.lead} />

      <Section className="pt-0">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              {/* The one form on the site, in the reader's language. Everything
                  it submits — scoring, routing, the dual emails — is the same
                  pipeline the English form uses. */}
              <QualifiedForm
                sourceType="contact_form"
                sourceDetail="localised-contact"
                headingLevel="h2"
              />
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <Eyebrow>{t.contact.officeEyebrow}</Eyebrow>
              <address className="body-text mt-4 not-italic text-muted-foreground">
                {site.address.street}
                <br />
                {site.address.locality}, {site.address.countryName}
              </address>
              <p className="caption mt-3">{t.contact.licenceLine}</p>
            </Reveal>

            <Reveal delay={0.16}>
              <Eyebrow className="mt-12 block">{t.contact.hoursEyebrow}</Eyebrow>
              <p className="body-text mt-4 text-muted-foreground">{t.contact.hoursBody}</p>
            </Reveal>

            <Reveal delay={0.22}>
              <Eyebrow className="mt-12 block">{t.contact.directEyebrow}</Eyebrow>
              <p className="mt-4">
                <a
                  href={`tel:${site.contact.phoneE164}`}
                  dir="ltr"
                  className="body-text prose-link inline-block text-foreground"
                >
                  {site.contact.phone}
                </a>
              </p>
              <p className="mt-2">
                <a
                  href={`mailto:${site.contact.email}`}
                  dir="ltr"
                  className="body-text prose-link inline-block text-foreground"
                >
                  {site.contact.email}
                </a>
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <TrustStrip className="pt-0" />
    </>
  );
}
