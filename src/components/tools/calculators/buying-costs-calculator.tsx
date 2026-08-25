import { useState } from "react";

import { Money } from "../money";
import {
  Assumptions,
  CalculatorLayout,
  Headline,
  NumberField,
  SubResult,
  ToggleField,
} from "../calculator-shell";
import { calculateBuyingCosts } from "@/data/calculations";
import { formatFeeValue, latestVerifiedOn, PURCHASE_FEES } from "@/data/fee-schedule";

/**
 * What a purchase costs beyond the price.
 *
 * Every fee is editable except the Dubai Land Department transfer fee, which is
 * the one genuinely fixed figure. Making the rest editable is not a convenience
 *. It is the honest position: commission is negotiated, trustee fees are
 * tiered, and developer NOC fees differ by developer. Presenting our defaults
 * as facts would be the mistake.
 */
export function BuyingCostsCalculator() {
  const [price, setPrice] = useState(2_000_000);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const result = calculateBuyingCosts(price, PURCHASE_FEES, overrides, excluded);
  const verifiedOn = latestVerifiedOn(PURCHASE_FEES);

  function toggle(key: string, include: boolean) {
    setExcluded((current) => {
      const next = new Set(current);
      if (include) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <CalculatorLayout
      inputs={
        <>
          <NumberField
            label="Purchase price"
            unit="AED"
            value={price}
            onChange={setPrice}
            step={50_000}
          />

          <div className="flex flex-col gap-6">
            <p className="eyebrow">Adjust the fees</p>
            {PURCHASE_FEES.map((fee) => (
              <div key={fee.key} className="border-t border-border/60 pt-5">
                {fee.optional ? (
                  <ToggleField
                    label={`Include ${fee.label.toLowerCase()}`}
                    checked={!excluded.has(fee.key)}
                    onChange={(checked) => toggle(fee.key, checked)}
                  />
                ) : null}

                {!excluded.has(fee.key) ? (
                  <div className={fee.optional ? "mt-4" : undefined}>
                    <NumberField
                      label={fee.label}
                      unit={fee.basis === "flat_aed" ? "AED" : "%"}
                      value={overrides[fee.key] ?? fee.value}
                      onChange={(value) =>
                        setOverrides((current) => ({ ...current, [fee.key]: value }))
                      }
                      step={fee.basis === "flat_aed" ? 100 : 0.25}
                      hint={
                        fee.editable ? fee.note : `Fixed at ${formatFeeValue(fee)}. ${fee.note}`
                      }
                    />
                    {!fee.editable ? (
                      <p className="caption mt-2 text-accent">
                        Set by the {fee.source}, not negotiable.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      }
      result={
        <>
          <Headline
            label="Total you need"
            value={<Money aed={result.totalOutlay} />}
            meaning={
              result.feesAsPercent === null
                ? "Enter a price to see the total."
                : `The price plus ${result.feesAsPercent.toFixed(1)}% in fees. This is the number to budget against, not the asking price.`
            }
          />

          <div className="mt-8">
            <SubResult label="Purchase price" value={<Money aed={price} size="body" />} />
            {result.lines.map((line) => (
              <SubResult
                key={line.key}
                label={line.label}
                note={line.note}
                value={<Money aed={line.amount} size="body" />}
              />
            ))}
            <SubResult
              label="Fees and costs"
              note="Everything on top of the price."
              value={<Money aed={result.totalFees} size="body" />}
            />
          </div>
        </>
      }
      assumptions={
        <Assumptions verifiedOn={verifiedOn}>
          <p className="caption max-w-measure">
            Not included: mortgage arrangement and valuation fees if you are borrowing, service
            charges from the transfer date, and any furnishing or fit-out. A cash purchase of a
            ready property is the simplest case, and this is it.
          </p>
        </Assumptions>
      }
    />
  );
}
