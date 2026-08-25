import { stagger } from "@/lib/motion";
import { useT } from "@/i18n";
import { Reveal } from "./reveal";
import type { Testimonial } from "@/data/types";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * Client words, set as pull quotes.
 *
 * Renders nothing when there are no published testimonials, an empty
 * "What our clients say" heading does more damage than no section at all.
 */
export function TestimonialsBlock({
  testimonials,
  eyebrow,
  title,
}: {
  testimonials: readonly Testimonial[];
  eyebrow?: string;
  title?: string;
}) {
  const t = useT();
  if (testimonials.length === 0) return null;

  const label = eyebrow ?? t.blocks.testimonialsEyebrow;
  const heading = title ?? t.blocks.testimonialsTitle;

  return (
    <Section className="bg-secondary">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Reveal>
            <Eyebrow>{label}</Eyebrow>
            <h2 className="display-3 mt-6">{heading}</h2>
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
                  {/* Where it came from, and a way to go and read it there. This
                      is the whole difference between a testimonial and a
                      review: one is a claim, the other is checkable. */}
                  {testimonial.source_url ? (
                    <>
                      {" · "}
                      <a
                        href={testimonial.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="link-underline text-accent"
                      >
                        {testimonial.source ?? "Read it at source"}
                      </a>
                    </>
                  ) : null}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
