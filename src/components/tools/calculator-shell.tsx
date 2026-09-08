import { useState, type ReactNode } from "react";

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

  /*
   * What the field shows while it is being edited, which is not always a
   * number.
   *
   * The bug this fixes: the input was driven straight off the numeric value,
   * and clearing it ran `Number("")`, which is 0, and 0 is finite. So emptying
   * the box wrote 0 back into state, the box re-rendered as "0", and that last
   * zero could not be deleted. Delete it, get it back, forever.
   *
   * Holding the raw text separately lets the field be genuinely empty while
   * the calculation below carries on with 0. `null` means "show the canonical
   * value"; a string means the person is mid-edit and their keystrokes win.
   * Blur hands control back, so a half-typed "1." tidies itself up.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (Number.isFinite(value) ? String(value) : "");

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
        value={shown}
        step={step}
        min={min}
        {...(max !== undefined ? { max } : {})}
        /*
         * Selects on focus, which is the other half of the same complaint.
         * Every one of these arrives prefilled, and a prefilled number reads
         * as a result rather than as something you are allowed to change.
         * Selecting it means the first key you press replaces the whole
         * figure, so typing works the way anyone would expect, and nobody has
         * to backspace through six digits to find out the field was theirs.
         */
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const next = Number(raw);
          onChange(raw.trim() === "" || !Number.isFinite(next) ? 0 : next);
        }}
        onBlur={() => setDraft(null)}
        className="w-full border border-input bg-paper px-4 py-3 font-sans text-2xl text-foreground outline-none transition-colors duration-quick ease-editorial hover:border-gold/60 focus:border-accent"
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
