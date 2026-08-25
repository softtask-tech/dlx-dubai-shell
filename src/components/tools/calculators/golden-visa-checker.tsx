import { useState } from "react";

import { Money } from "../money";
import {
  Assumptions,
  CalculatorLayout,
  Headline,
  NumberField,
  ToggleField,
} from "../calculator-shell";
import { indicateGoldenVisa } from "@/data/calculations";
import { GOLDEN_VISA } from "@/data/fee-schedule";
import { Eyebrow } from "@/components/ui/section";

/**
 * Golden Visa indication.
 *
 * This tool deliberately never says "you qualify".
 *
 * Eligibility is decided by the UAE authorities on a whole application,
 * criteria change, and someone might commit to a multi-million-dirham purchase
 * on the strength of what a web page told them. So the output is framed as
 * where a purchase sits against commonly cited thresholds, and what to have
 * confirmed in writing, with the disclaimer in the result itself rather than
 * in small print underneath.
 */
export function GoldenVisaChecker() {
  const [value, setValue] = useState(2_000_000);
  const [ownedOutright, setOwnedOutright] = useState(true);
  const [isOffPlan, setIsOffPlan] = useState(false);
  const [spouse, setSpouse] = useState(true);
  const [children, setChildren] = useState(2);

  const indication = indicateGoldenVisa({
    propertyValueAed: value,
    ownedOutright,
    isOffPlan,
    spouse,
    children,
  });

  return (
    <CalculatorLayout
      inputs={
        <>
          <NumberField
            label="Property value"
            unit="AED"
            value={value}
            onChange={setValue}
            step={100_000}
            hint="The purchase price, or the current value if you already own it."
          />
          <ToggleField
            label="Owned outright, without a mortgage"
            checked={ownedOutright}
            onChange={setOwnedOutright}
            hint="Financed purchases can carry additional conditions."
          />
          <ToggleField
            label="This is an off-plan property"
            checked={isOffPlan}
            onChange={setIsOffPlan}
            hint="Completion and title registration affect timing."
          />
          <ToggleField label="I would sponsor a spouse" checked={spouse} onChange={setSpouse} />
          <NumberField
            label="Children to sponsor"
            value={children}
            onChange={setChildren}
            step={1}
            max={12}
          />
        </>
      }
      result={
        <>
          <Headline
            label="Indication only"
            value={<span className="display-3">{indication.routeLabel}</span>}
            meaning={
              indication.shortfallToNextAed !== null && indication.shortfallToNextAed > 0 ? (
                <>
                  A further <Money aed={indication.shortfallToNextAed} size="body" /> of property
                  value would reach the next commonly cited route. Whether that is worth doing is a
                  conversation, not a calculation.
                </>
              ) : (
                "This is where your purchase sits against thresholds that are commonly cited. It is not an eligibility decision, and only the authority can give you one."
              )
            }
            tone={indication.route === "long_term" ? "positive" : "caution"}
          />

          {indication.sponsorship.length > 0 ? (
            <div className="mt-10">
              <Eyebrow>Family sponsorship</Eyebrow>
              <ul className="mt-5">
                {indication.sponsorship.map((line) => (
                  <li key={line} className="body-text border-t border-border/60 py-4">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10">
            <Eyebrow>What to confirm before you commit</Eyebrow>
            <ul className="mt-5">
              {indication.considerations.map((line) => (
                <li
                  key={line}
                  className="body-text border-t border-border/60 py-4 text-muted-foreground"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* The disclaimer belongs with the result, not beneath the fold. */}
          <p className="body-text mt-10 border border-accent p-6 text-foreground">
            {GOLDEN_VISA.disclaimer}
          </p>
        </>
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "Long-term route",
              value: `AED ${GOLDEN_VISA.propertyThresholdAed.toLocaleString("en-AE")}`,
              source: GOLDEN_VISA.source,
            },
            {
              label: "Shorter route",
              value: `AED ${GOLDEN_VISA.shorterRouteThresholdAed.toLocaleString("en-AE")}`,
              source: GOLDEN_VISA.source,
            },
          ]}
          verifiedOn={GOLDEN_VISA.verifiedOn}
        >
          <p className="caption max-w-measure">
            DLX handles the property side of a purchase made with residency in mind. We do not
            process visa applications and we will not tell you whether you qualify. We will
            introduce you to licensed immigration advisers who can put it in writing.
          </p>
        </Assumptions>
      }
    />
  );
}
