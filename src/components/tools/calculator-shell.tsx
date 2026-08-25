import type { ReactNode } from "react";

import { formatMonth } from "@/lib/format";
import { Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * The frame every calculator sits in.
 *
 * Inputs on the left, the answer on the right, and, the part that matters,
 * the assumptions underneath rather than hidden. A calculator that shows a
 * confident number and conceals what produced it is worse than no calculator,
 * because the reader has no way to know whether it applies to them.
 */
export function CalculatorLayout({
  inputs,
  result,
  assumptions,
}: {
  inputs: ReactNode;
  result: ReactNode;
  assumptions?: ReactNode;
}) {
  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="flex flex-col gap-8 lg:col-span-5">{inputs}</div>
      <div className="lg:col-span-6 lg:col-start-7">
        {result}
        {assumptions ? <div className="mt-12">{assumptions}</div> : null}
      </div>
    </div>
  );
}

/** The single number a calculator exists to produce, with its meaning. */
export function Headline({
  label,
  value,
  meaning,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  meaning: ReactNode;
  tone?: "neutral" | "positive" | "caution";
}) {
  return (
    <div
      className={cn(
        "border p-8",
        tone === "positive" && "border-accent",
        tone === "caution" && "border-foreground/30",
        tone === "neutral" && "border-border",
      )}
    >
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-4">{value}</div>
      <p className="body-text mt-5 max-w-measure text-muted-foreground">{meaning}</p>
    </div>
  );
}

/** A secondary figure beneath the headline. */
export function SubResult({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-border/60 py-4">
      <div>
        <p className="body-text">{label}</p>
        {note ? <p className="caption mt-1 max-w-measure">{note}</p> : null}
      </div>
      <div className="shrink-0 text-end">{value}</div>
    </div>
  );
}

/**
 * What the calculation assumed, stated openly.
 *
 * Every calculator has one of these. If a figure came from the fee schedule it
 * is named with its source and date; if the visitor set it, it says so.
 */
export function Assumptions({
  entries,
  verifiedOn,
  children,
}: {
  entries?: ReadonlyArray<{ label: string; value: string; source?: string }>;
  /** Shows the "accurate as of" line for legal, fee or tax figures. */
  verifiedOn?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-8">
      <Eyebrow>What this assumes</Eyebrow>
      {entries && entries.length > 0 ? (
        <dl className="mt-5">
          {entries.map((entry) => (
            <div
              key={entry.label}
              className="flex gap-6 border-b border-border/50 py-3 last:border-0"
            >
              <dt className="caption w-52 shrink-0">{entry.label}</dt>
              <dd className="caption text-foreground">
                {entry.value}
                {entry.source ? (
                  <span className="text-muted-foreground"> · {entry.source}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
      {verifiedOn ? (
        <p className="caption mt-6 text-accent">
          Fees and thresholds accurate as of {formatMonth(verifiedOn)} · verify current figures with
          the relevant authority before you rely on them.
        </p>
      ) : null}
    </div>
  );
}

/** A labelled numeric input with a unit. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  hint,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="eyebrow">
        {label}
        {unit ? <span className="text-muted-foreground"> ({unit})</span> : null}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        {...(max !== undefined ? { max } : {})}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) ? next : 0);
        }}
        className="w-full border-0 border-b border-border bg-transparent pb-3 pt-1 font-sans text-2xl font-light text-foreground outline-none transition-colors duration-quick ease-editorial focus:border-accent"
      />
      {hint ? <p className="caption">{hint}</p> : null}
    </div>
  );
}

/** A choice between a small number of options. */
export function OptionField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow mb-1">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "eyebrow block border px-4 py-3 transition-colors duration-quick ease-editorial",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                value === option.value
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-border text-foreground hover:border-foreground",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="caption">{hint}</p> : null}
    </fieldset>
  );
}

/** A yes/no toggle. */
export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <span className="eyebrow">{label}</span>
      </label>
      {hint ? <p className="caption ms-8">{hint}</p> : null}
    </div>
  );
}
