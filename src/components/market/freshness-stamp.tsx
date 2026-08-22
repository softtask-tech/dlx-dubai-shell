import type { SourceAttribution } from "@/data/market-types";
import { formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The line beneath every figure on the site.
 *
 * It reads its wording from the attribution derived from stored provenance, so
 * it says "Source: Dubai Land Department" only when the rows behind the number
 * really are DLD records — and says plainly that figures are illustrative when
 * they are not. That is the difference between citing a source and claiming one.
 *
 * DLX is not affiliated with the Dubai Land Department, and the official
 * wording is careful to attribute rather than imply endorsement.
 */
export function FreshnessStamp({
  attribution,
  className,
}: {
  attribution: SourceAttribution;
  className?: string;
}) {
  const updated = attribution.updatedAt ? formatMonth(attribution.updatedAt) : null;

  return (
    <p
      className={cn("caption", !attribution.isOfficial && "text-accent", className)}
      data-provenance={attribution.isOfficial ? "official" : "unofficial"}
    >
      {updated ? `Updated ${updated} · ` : null}
      {attribution.label}
    </p>
  );
}
