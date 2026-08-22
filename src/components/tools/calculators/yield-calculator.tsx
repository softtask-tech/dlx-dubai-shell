import { useState } from "react";

import { Money } from "../money";
import {
  Assumptions,
  CalculatorLayout,
  Headline,
  NumberField,
  SubResult,
} from "../calculator-shell";
import { calculateYield } from "@/data/calculations";
import { HOLDING_COSTS } from "@/data/fee-schedule";
import type { AreaWithStats } from "@/data/market-types";
import { Select } from "@/components/forms/fields";

/**
 * ROI and rental yield.
 *
 * Leads with the net figure, because gross is the number that gets quoted and
 * net is the number that reaches you. The gap between them — service charges
 * and voids — is shown rather than buried, since in Dubai it is often more than
 * a percentage point.
 */
export function YieldCalculator({ areas }: { areas: readonly AreaWithStats[] }) {
  const [price, setPrice] = useState(2_000_000);
  const [rent, setRent] = useState(140_000);
  const [sqft, setSqft] = useState(1200);
  const [serviceCharge, setServiceCharge] = useState<number>(
    HOLDING_COSTS.serviceChargePerSqftAed.value,
  );
  const [voids, setVoids] = useState<number>(HOLDING_COSTS.maintenanceAndVoidsPercent.value);
  const [areaSlug, setAreaSlug] = useState("");

  const result = calculateYield({
    purchasePriceAed: price,
    annualRentAed: rent,
    areaSqft: sqft,
    serviceChargePerSqft: serviceCharge,
    maintenanceAndVoidsPercent: voids,
  });

  /* Communities we hold recorded evidence for, so the visitor can start from a
   * real median rather than a number they invented. */
  const withStats = areas.filter((area) => area.stats?.median_price_per_sqft);
  const selected = withStats.find((area) => area.slug === areaSlug);

  function applyArea(slug: string) {
    setAreaSlug(slug);
    const area = withStats.find((entry) => entry.slug === slug);
    if (!area?.stats?.median_price_per_sqft) return;

    /* Fill price from the community's recorded median at the current size, and
     * rent from its recorded gross yield where we have one. */
    const nextPrice = Math.round(area.stats.median_price_per_sqft * sqft);
    setPrice(nextPrice);
    if (area.stats.gross_yield_pct) {
      setRent(Math.round((nextPrice * area.stats.gross_yield_pct) / 100));
    }
  }

  const netVsGross =
    result.grossYieldPct !== null && result.netYieldPct !== null
      ? result.grossYieldPct - result.netYieldPct
      : null;

  return (
    <CalculatorLayout
      inputs={
        <>
          {withStats.length > 0 ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="area" className="eyebrow">
                Start from a community
              </label>
              <Select
                id="area"
                value={areaSlug}
                onChange={(event) => applyArea(event.target.value)}
              >
                <option value="">Enter my own figures</option>
                {withStats.map((area) => (
                  <option key={area.id} value={area.slug}>
                    {area.name}
                  </option>
                ))}
              </Select>
              <p className="caption">
                {selected?.stats?.median_price_per_sqft
                  ? `Fills price and rent from ${selected.name}'s recorded median. Change anything.`
                  : "Fills price and rent from that community's recorded transactions."}
              </p>
            </div>
          ) : null}

          <NumberField
            label="Purchase price"
            unit="AED"
            value={price}
            onChange={setPrice}
            step={50_000}
          />
          <NumberField
            label="Annual rent"
            unit="AED"
            value={rent}
            onChange={setRent}
            step={5_000}
          />
          <NumberField
            label="Internal area"
            unit="sq ft"
            value={sqft}
            onChange={setSqft}
            step={50}
          />
          <NumberField
            label="Service charge"
            unit="AED per sq ft per year"
            value={serviceCharge}
            onChange={setServiceCharge}
            step={1}
            hint="The single biggest swing factor. Use the real figure for your building — ask us and we will get it."
          />
          <NumberField
            label="Maintenance and voids"
            unit="% of rent"
            value={voids}
            onChange={setVoids}
            step={1}
            max={50}
            hint="An allowance for repairs and empty months between tenants."
          />
        </>
      }
      result={
        <>
          <Headline
            label="Net yield"
            value={
              <span className="display-2">
                {result.netYieldPct === null ? "—" : `${result.netYieldPct.toFixed(2)}%`}
              </span>
            }
            meaning={
              result.netYieldPct === null
                ? "Enter a purchase price to see the return."
                : netVsGross !== null && netVsGross > 0
                  ? `What actually reaches you after costs. That is ${netVsGross.toFixed(2)} percentage points below the gross figure most listings quote — the gap is service charges and voids.`
                  : "What reaches you after costs."
            }
            tone={result.netYieldPct !== null && result.netYieldPct >= 6 ? "positive" : "neutral"}
          />

          <div className="mt-8">
            <SubResult
              label="Gross yield"
              note="Rent over price, with nothing taken off. The number usually quoted."
              value={
                <span className="body-text">
                  {result.grossYieldPct === null ? "—" : `${result.grossYieldPct.toFixed(2)}%`}
                </span>
              }
            />
            <SubResult
              label="Net annual income"
              note="After service charges and the voids allowance."
              value={<Money aed={result.netAnnualIncome} size="body" />}
            />
            <SubResult
              label="Service charge"
              note="Per year, at the rate you entered."
              value={<Money aed={result.annualServiceCharge} size="body" />}
            />
            <SubResult
              label="Maintenance and voids"
              value={<Money aed={result.annualMaintenanceAndVoids} size="body" />}
            />
            <SubResult
              label="Years to return the price"
              note="On net income alone, ignoring any change in value."
              value={
                <span className="body-text">
                  {result.paybackYears === null ? "—" : `${result.paybackYears.toFixed(1)} years`}
                </span>
              }
            />
          </div>
        </>
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "Service charge",
              value: `AED ${serviceCharge}/sq ft/year`,
              source: "your figure",
            },
            { label: "Maintenance and voids", value: `${voids}% of rent`, source: "your figure" },
            {
              label: "Not included",
              value: "Mortgage costs, income tax in your home country, agency letting fees",
            },
          ]}
        >
          <p className="caption max-w-measure">
            Yield says what a property returns, not whether it is a good buy. A high yield in a
            community with falling prices is a poor investment wearing a good number.
          </p>
        </Assumptions>
      }
    />
  );
}
