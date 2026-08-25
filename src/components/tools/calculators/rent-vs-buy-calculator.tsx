import { useState } from "react";

import { Money } from "../money";
import {
  Assumptions,
  CalculatorLayout,
  Headline,
  NumberField,
  SubResult,
} from "../calculator-shell";
import { calculateBuyingCosts, calculateRentVsBuy } from "@/data/calculations";
import { PURCHASE_FEES } from "@/data/fee-schedule";

/**
 * Rent or buy.
 *
 * The answer is a year, not a verdict: buying carries several per cent in
 * transaction costs before you own anything, so the honest question is how long
 * you would need to stay for that to be worth paying.
 *
 * Growth defaults are deliberately modest. A calculator that assumes buoyant
 * appreciation will always say "buy", which makes it marketing rather than a
 * tool.
 */
export function RentVsBuyCalculator() {
  const [price, setPrice] = useState(2_000_000);
  const [rent, setRent] = useState(140_000);
  const [serviceCharge, setServiceCharge] = useState(20_000);
  const [priceGrowth, setPriceGrowth] = useState(3);
  const [rentGrowth, setRentGrowth] = useState(3);
  const [years, setYears] = useState(10);

  /* Upfront cost comes from the same fee schedule as the costs calculator, so
   * the two tools cannot disagree about what a purchase costs. */
  const upfront = calculateBuyingCosts(price, PURCHASE_FEES).totalFees;

  const result = calculateRentVsBuy({
    purchasePriceAed: price,
    annualRentAed: rent,
    upfrontCostsAed: upfront,
    annualServiceChargeAed: serviceCharge,
    priceGrowthPct: priceGrowth,
    rentGrowthPct: rentGrowth,
    sellingCostsPct: 2,
    years,
  });

  const final = result.years[result.years.length - 1];

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
          <NumberField
            label="Annual rent for the same home"
            unit="AED"
            value={rent}
            onChange={setRent}
            step={5_000}
            hint="What it would cost you to rent the property you are considering buying."
          />
          <NumberField
            label="Annual service charge"
            unit="AED"
            value={serviceCharge}
            onChange={setServiceCharge}
            step={1_000}
            hint="Paid by the owner, not the tenant, which is part of why buying costs more than the mortgage."
          />
          <NumberField
            label="Assumed price growth"
            unit="% a year"
            value={priceGrowth}
            onChange={setPriceGrowth}
            step={0.5}
            hint="An assumption you are making, not a forecast anyone can give you."
          />
          <NumberField
            label="Assumed rent growth"
            unit="% a year"
            value={rentGrowth}
            onChange={setRentGrowth}
            step={0.5}
          />
          <NumberField
            label="Years to compare"
            value={years}
            onChange={setYears}
            step={1}
            min={1}
            max={30}
          />
        </>
      }
      result={
        <>
          <Headline
            label="Buying overtakes renting"
            value={
              <span className="display-2">
                {result.breakEvenYear === null
                  ? `Not within ${years} years`
                  : `Year ${result.breakEvenYear}`}
              </span>
            }
            meaning={
              result.breakEvenYear === null
                ? `On these assumptions, renting stays cheaper for the whole period. If you are not confident of staying longer than ${years} years, renting is the lower-risk answer.`
                : `Stay longer than ${result.breakEvenYear} ${result.breakEvenYear === 1 ? "year" : "years"} and buying costs less overall. Shorter than that and the upfront fees have not been earned back.`
            }
            tone={
              result.breakEvenYear !== null && result.breakEvenYear <= 5 ? "positive" : "caution"
            }
          />

          <div className="mt-8">
            <SubResult
              label="Upfront cost of buying"
              note="Transfer fee, commission and the rest, paid before you own anything."
              value={<Money aed={upfront} size="body" />}
            />
            {final ? (
              <>
                <SubResult
                  label={`Rent paid over ${years} years`}
                  value={<Money aed={final.cumulativeRentPaid} size="body" />}
                />
                <SubResult
                  label={`Net cost of owning over ${years} years`}
                  note="Costs paid, less the equity you would have gained."
                  value={<Money aed={final.buyingNetCost} size="body" />}
                />
                <SubResult
                  label={`Difference after ${years} years`}
                  note={
                    final.advantageOfBuying >= 0 ? "In favour of buying." : "In favour of renting."
                  }
                  value={<Money aed={Math.abs(final.advantageOfBuying)} size="body" />}
                />
              </>
            ) : null}
          </div>
        </>
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "Upfront costs",
              value: "From the buying cost schedule",
              source: "DLD and market convention",
            },
            { label: "Selling costs", value: "2% of the sale price" },
            {
              label: "Not modelled",
              value: "Mortgage interest, or what a renter might earn by investing the difference",
            },
          ]}
        >
          <p className="caption max-w-measure">
            A cash comparison. It leaves out mortgage interest and any return a renter might make on
            the money not spent on fees, both depend on assumptions nobody can stand behind, and
            including them would make this look more authoritative without making it more true.
          </p>
        </Assumptions>
      }
    />
  );
}
