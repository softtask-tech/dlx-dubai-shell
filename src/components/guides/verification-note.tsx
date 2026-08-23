import { cn } from "@/lib/utils";
import { formatMonth } from "@/lib/format";

/**
 * The dated "confirm this before you rely on it" note.
 *
 * CLAUDE.md forbids inventing legal, visa or tax specifics. Where a guide has
 * to describe how one of those works, this note travels with it: it names the
 * date the content was last reviewed and sends the reader to the authority for
 * anything they intend to act on. It is deliberately plain and visible — a
 * disclaimer nobody reads protects nobody.
 */
export function VerificationNote({
  reviewedOn,
  className,
  subject = "Visa, tax and legal rules",
}: {
  /** ISO date the content was last reviewed. */
  reviewedOn: string;
  className?: string;
  /** What the note is about, so it reads naturally in context. */
  subject?: string;
}) {
  return (
    <p className={cn("caption border-s-2 border-accent ps-6 text-muted-foreground", className)}>
      <span className="text-accent">Accurate as of {formatMonth(reviewedOn)}.</span> {subject}{" "}
      change, and how they apply depends on your circumstances. Treat this as orientation, not
      advice — verify anything you intend to act on with the relevant UAE authority or a licensed
      adviser. We will introduce you to one.
    </p>
  );
}
