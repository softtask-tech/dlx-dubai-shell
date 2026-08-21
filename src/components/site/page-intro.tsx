import { Section, Eyebrow } from "@/components/ui/section";
import { Reveal } from "./reveal";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/** Shared editorial page header used by the placeholder routes. */
export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <Section className="pt-44 pb-24 lg:pt-56">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-8 text-5xl leading-[1.05] md:text-7xl">{title}</h1>
          </Reveal>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal delay={0.12}>
            <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-10 h-px w-16 bg-accent" />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
