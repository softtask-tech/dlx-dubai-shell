import { cn } from "@/lib/utils";
import { advisor } from "@/config/advisor";

/**
 * "Ask Noor to explain this simply."
 *
 * The golden rule says never put intimidating data on the surface, and the
 * usual answer is a tooltip. A tooltip is the wrong shape here: it is one
 * sentence, written once, that cannot answer the follow-up. This hands the term
 * to the advisor instead, which can explain it, give a worked example, and then
 * answer "yes but what about mine?" — which is the question the reader actually
 * has.
 *
 * It is a plain anchor to `#ask=…`, so it works before hydration and a reader
 * can copy the link.
 */
export function ExplainLink({
  question,
  label = "Ask Noor to explain this simply",
  className,
}: {
  /** The exact question handed to the advisor. */
  question: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`#ask=${encodeURIComponent(question)}`}
      className={cn(
        "caption inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-accent" />
      {label.replace("Noor", advisor.name)}
    </a>
  );
}
