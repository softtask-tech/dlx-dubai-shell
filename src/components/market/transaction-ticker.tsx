import type { DldTransaction } from "@/data/market-types";
import { formatArea, formatBedrooms, humanise } from "@/lib/format";
import { Price } from "@/components/tools/money";
import { Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * The latest recorded sales.
 *
 * A list, not a scrolling marquee. Moving text is hard to read, impossible to
 * scan, and a genuine accessibility problem — and the evidence is the point
 * here, so it should sit still long enough to be read.
 */
export function TransactionTicker({ transactions }: { transactions: readonly DldTransaction[] }) {
  if (transactions.length === 0) return null;

  return (
    <div>
      <Eyebrow>Latest recorded sales</Eyebrow>
      <ul className="mt-6">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className="grid items-baseline gap-2 border-t border-border/60 py-4 md:grid-cols-12"
          >
            <span className="caption md:col-span-2">
              {new Date(transaction.transaction_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="body-text md:col-span-4">
              {transaction.building_name ?? transaction.area_name_raw}
            </span>
            <span className="caption md:col-span-3">
              {[
                humanise(transaction.property_type),
                formatBedrooms(transaction.bedrooms),
                formatArea(transaction.area_sqft),
              ]
                .filter((part) => part !== "—")
                .join(" · ")}
            </span>
            <span className="eyebrow text-foreground md:col-span-2 md:text-end">
              <Price amount={transaction.amount} />
            </span>
            <span className="md:col-span-1 md:text-end">
              {transaction.registration_type?.toLowerCase().includes("off") ? (
                <Tag variant="bare">Off-plan</Tag>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
