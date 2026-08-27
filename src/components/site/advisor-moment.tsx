import { advisor } from "@/config/advisor";
import { Photo } from "@/components/site/photo";
import { Container, Eyebrow } from "@/components/ui/section";

/**
 * Noor, shown rather than described.
 *
 * The temptation with an AI feature is to draw a fake chat window out of divs
 * and put invented answers in it. That is a lie about a product that exists,
 * and it is also the most recognisable tell in the genre. So this section
 * contains no mock interface at all. What it contains is two true things:
 *
 *   the guardrails, taken from `src/config/advisor.ts`, which is the same
 *   object the panel and the system prompt read, so the promises here cannot
 *   drift from the behaviour; and
 *
 *   four real questions, as real controls. Each is a link to `#ask=…`, the
 *   deep link the dock already listens for, so clicking one opens the actual
 *   advisor with that question in it. Nothing here is a picture of a feature.
 *
 * On the dark ground, because this is the second of the page's two cinematic
 * anchors and because a product moment set in the same white as the editorial
 * around it does not read as a moment.
 */
export function AdvisorMoment() {
  return (
    <section data-surface="dark" className="overflow-hidden">
      <div className="grid lg:grid-cols-12">
        {/* Full-height photograph running to the page edge. It is the only
            section on the page where an image is bled off one side only, which
            is most of why the composition does not repeat anything above it. */}
        <div className="relative min-h-[22rem] lg:col-span-5 lg:min-h-[42rem]">
          <Photo
            slug="downtown-night-monochrome"
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/35" />
        </div>

        <div className="lg:col-span-7">
          <Container className="py-section lg:ps-14">
            <div className="max-w-xl">
              <Eyebrow>
                {advisor.name}, {advisor.role}
              </Eyebrow>
              <h2 className="display-2 mt-5 text-balance">
                An advisor that will tell you when it does not know.
              </h2>
              <p className="body-text mt-6 text-on-dark-muted">
                {advisor.disclosure} It answers from our Dubai Land Department data and our
                published fee schedule, in your language, at any hour.
              </p>

              {/* The actual guardrails, read from the config the product runs
                  on. If the behaviour changes, this changes with it. */}
              <ul className="mt-10 border-t border-border">
                {advisor.limits.map((limit) => (
                  <li key={limit} className="body-text border-b border-border py-4 text-on-dark">
                    {limit}
                  </li>
                ))}
              </ul>

              <p className="eyebrow mt-10">Ask it something</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {advisor.prompts.map((prompt) => (
                  <a
                    key={prompt}
                    href={`#ask=${encodeURIComponent(prompt)}`}
                    className="body-text border border-border px-4 py-2.5 text-start text-on-dark transition-colors duration-base ease-editorial hover:border-accent hover:text-accent"
                  >
                    {prompt}
                  </a>
                ))}
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
