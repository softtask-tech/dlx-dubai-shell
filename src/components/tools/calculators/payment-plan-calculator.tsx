import { useState } from "react";

import { Money } from "../money";
import {
  Assumptions,
  CalculatorLayout,
  Headline,
  NumberField,
  SubResult,
} from "../calculator-shell";
import { buildPaymentPlan } from "@/data/calculations";
import { Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * Off-plan payment plans, as dates and amounts.
 *
 * "60/40 with a 2-year post-handover plan" is marketing shorthand. What a buyer
 * needs is what falls due, and when — particularly how much lands before
 * handover, since that is the money they must actually have.
 */
export function PaymentPlanCalculator() {
  const [price, setPrice] = useState(1_800_000);
  const [downPayment, setDownPayment] = useState(20);
  const [constructionInstalments, setConstructionInstalments] = useState(4);
  const [duringConstruction, setDuringConstruction] = useState(40);
  const [onHandover, setOnHandover] = useState(20);
  const [postHandoverInstalments, setPostHandoverInstalments] = useState(8);
  const [monthsToHandover, setMonthsToHandover] = useState(24);

  const plan = buildPaymentPlan({
    purchasePriceAed: price,
    downPaymentPct: downPayment,
    constructionInstalments,
    duringConstructionPct: duringConstruction,
    onHandoverPct: onHandover,
    postHandoverInstalments,
    monthsToHandover,
  });

  const monthLabel = (monthsFromNow: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  const beforeHandoverPct = price > 0 ? (plan.dueBeforeHandover / price) * 100 : 0;

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
            label="Booking payment"
            unit="% of price"
            value={downPayment}
            onChange={setDownPayment}
            step={5}
            max={100}
          />
          <NumberField
            label="Paid during construction"
            unit="% of price"
            value={duringConstruction}
            onChange={setDuringConstruction}
            step={5}
            max={100}
          />
          <NumberField
            label="Construction instalments"
            value={constructionInstalments}
            onChange={setConstructionInstalments}
            step={1}
            max={24}
          />
          <NumberField
            label="Paid at handover"
            unit="% of price"
            value={onHandover}
            onChange={setOnHandover}
            step={5}
            max={100}
          />
          <NumberField
            label="Post-handover instalments"
            value={postHandoverInstalments}
            onChange={setPostHandoverInstalments}
            step={1}
            max={40}
            hint="Quarterly, in most developer plans. The remaining percentage is spread across these."
          />
          <NumberField
            label="Months until handover"
            value={monthsToHandover}
            onChange={setMonthsToHandover}
            step={3}
            max={120}
          />
        </>
      }
      result={
        <>
          <Headline
            label="Due before you get the keys"
            value={<Money aed={plan.dueBeforeHandover} />}
            meaning={
              plan.isUnbalanced
                ? `Your percentages add to ${plan.totalPercent.toFixed(0)}%, not 100%. Check the plan against the developer's schedule — this is the most common place a plan is misread.`
                : `${beforeHandoverPct.toFixed(0)}% of the price falls due on or before handover. That is the money you need to actually have; the rest follows afterwards.`
            }
            tone={plan.isUnbalanced ? "caution" : "neutral"}
          />

          <div className="mt-8">
            <SubResult
              label="After handover"
              note={
                postHandoverInstalments > 0
                  ? `Spread across ${postHandoverInstalments} quarterly instalments.`
                  : "No post-handover portion on this plan."
              }
              value={<Money aed={plan.dueAfterHandover} size="body" />}
            />
          </div>

          <div className="mt-12">
            <Eyebrow>The schedule</Eyebrow>
            <ul className="mt-5">
              {plan.milestones.map((milestone, index) => (
                <li
                  key={`${milestone.label}-${index}`}
                  className="grid items-baseline gap-2 border-t border-border/60 py-4 md:grid-cols-12"
                >
                  <span className="caption md:col-span-3">
                    {monthLabel(milestone.monthsFromNow)}
                  </span>
                  <span className="body-text md:col-span-5">{milestone.label}</span>
                  <span className="caption md:col-span-2">
                    {milestone.percentOfPrice.toFixed(1)}%
                  </span>
                  <span className="md:col-span-2 md:text-right">
                    <Money aed={milestone.amount} size="body" />
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Tag variant="bare">{plan.milestones.length} payments</Tag>
              <Tag variant="bare">Handover {monthLabel(monthsToHandover)}</Tag>
            </div>
          </div>
        </>
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "Instalment spacing",
              value: "Construction payments spread evenly to handover",
            },
            { label: "Post-handover", value: "Quarterly, which is the usual developer pattern" },
            {
              label: "Not included",
              value: "DLD fees, which fall due at registration, not on this schedule",
            },
          ]}
        >
          <p className="caption max-w-measure">
            Developer plans are often linked to construction milestones rather than dates, so real
            instalments can arrive earlier or later than shown. Use this to understand the shape of
            a plan, and the developer's own schedule for the dates you commit to.
          </p>
        </Assumptions>
      }
    />
  );
}
