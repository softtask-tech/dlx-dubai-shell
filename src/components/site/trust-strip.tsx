import { useT } from "@/i18n";
import { stagger } from "@/lib/motion";
import { Reveal } from "./reveal";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * The credentials line.
 *
 * Every audience DLX designs for needs a reason to trust a small brokerage
 * within the first scroll, and they need different ones: the licence number for
 * the GCC reader, the data source for the analyst, the languages for the family
 * relocating. Four short facts, stated plainly, no badges or seals — a claim
 * that can be checked is worth more than a graphic that cannot.
 *
 * The facts now come from the dictionary, which means the Arabic reader is told
 * about the licence in Arabic. That matters more here than anywhere else on the
 * page: this is the block whose whole job is to be believed.
 */
export function TrustStrip({ className }: { className?: string }) {
  const t = useT();

  return (
    <Section className={className}>
      <h2 className="sr-only">{t.trust.heading}</h2>
      <div className="hairline" />
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {t.trust.credentials.map((credential, index) => (
          <Reveal key={credential.label} delay={stagger(index)}>
            <div className="flex h-full flex-col gap-4 bg-background pt-10 pe-8 pb-2">
              <Eyebrow>{credential.label}</Eyebrow>
              <p className="display-3">{credential.value}</p>
              <p className="caption">{credential.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
