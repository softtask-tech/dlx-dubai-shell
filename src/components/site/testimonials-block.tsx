import { stagger } from "@/lib/motion";
import { Reveal } from "./reveal";
import type { Testimonial } from "@/data/types";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * Client words, set as pull quotes.
 *
 * Renders nothing when there are no published testimonials — an empty
 * "What our clients say" heading does more damage than no section at all.
 */
export function TestimonialsBlock({
  testimonials,
  eyebrow = "In their words",
  title = "What clients say",
}: {
  testimonials: readonly Testimonial[];
  eyebrow?: string;
  title?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <Section className="bg-secondary">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="display-3 mt-6">{title}</h2>
          </Reveal>
        </div>
        <div className="lg:col-span-8 lg:col-start-5">
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.id}
              delay={stagger(index)}
              className="border-t border-border/60 py-10 first:border-0 first:pt-0"
            >
              <figure>
                <blockquote className="lead">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                <figcaption className="eyebrow mt-6">
                  {testimonial.author_name}
                  {testimonial.author_location ? ` · ${testimonial.author_location}` : null}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
