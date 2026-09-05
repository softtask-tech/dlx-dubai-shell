import { ArrowUpRight, Sparkles } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui/section";

export type ConversionIntent = "availability" | "matching" | "assessment" | "consultation";

export function ContextualConversion({
  source,
  intent = "consultation",
  title = "Bring the decision into focus.",
}: {
  source: string;
  intent?: ConversionIntent;
  title?: string;
}) {
  const params = new URLSearchParams({ intent, source });
  return (
    <section
      data-surface="dark"
      className="bg-ink py-section-sm"
      aria-labelledby="conversion-title"
    >
      <Container className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <Eyebrow>Human advice, when useful</Eyebrow>
          <h2 id="conversion-title" className="display-2 mt-4">
            {title}
          </h2>
          <p className="body-text mt-4 max-w-measure text-muted-foreground">
            Tell us what you are trying to achieve. The next questions adapt to that context.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-4 md:col-start-9 md:justify-end">
          <a
            href={`/contact?${params.toString()}`}
            className="focus-ring touch-target flex items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Speak to a consultant
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
          <a
            href={`#ask=I%20need%20help%20with%20${encodeURIComponent(intent)}`}
            className="focus-ring touch-target flex items-center gap-2 border border-border px-5 text-sm font-medium"
          >
            <Sparkles aria-hidden className="size-4" />
            Ask DLX AI
          </a>
        </div>
      </Container>
    </section>
  );
}
