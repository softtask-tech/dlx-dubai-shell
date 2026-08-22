import { site } from "@/config/site";
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
 */

type Credential = { label: string; value: string; detail: string };

const CREDENTIALS: readonly Credential[] = [
  {
    label: "Licensed",
    value: `RERA ORN ${site.reraOrn}`,
    detail: "Registered with Dubai's Real Estate Regulatory Agency.",
  },
  {
    label: "Based",
    value: `${site.address.street}, ${site.address.locality}`,
    detail: "A real office, in the district we transact in.",
  },
  {
    label: "Evidence",
    value: "Dubai Land Department data",
    detail: "We price from recorded transactions, and we cite them.",
  },
  {
    label: "Languages",
    value: "English & Arabic",
    detail: "Represented in the language you would rather negotiate in.",
  },
];

export function TrustStrip({ className }: { className?: string }) {
  return (
    <Section className={className}>
      <div className="hairline" />
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {CREDENTIALS.map((credential, index) => (
          <Reveal key={credential.label} delay={stagger(index)}>
            <div className="flex h-full flex-col gap-4 bg-background pt-10 pr-8 pb-2">
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
