import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form fields in the house voice: a label set as an eyebrow, a hairline rule
 * instead of a box, and the accent reserved for focus. No rounded inputs.
 */

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function Field({ label, name, hint, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="eyebrow">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="caption">{hint}</p> : null}
      {error ? (
        <p role="alert" className="caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full border-0 border-b border-border bg-transparent pb-3 pt-1 font-sans text-base font-light text-foreground outline-none transition-colors duration-quick ease-editorial placeholder:text-muted-foreground/60 focus:border-accent disabled:opacity-50";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlClass, className)} {...props} />
));
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(controlClass, "resize-none", className)}
    {...props}
  />
));
TextArea.displayName = "TextArea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(controlClass, "cursor-pointer", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

type ChoiceProps = {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  children: React.ReactNode;
};

/**
 * A choice in a group. Rendered as a real radio input so the group is
 * keyboard-navigable with arrow keys and announced correctly, with the visual
 * treatment driven off `peer-checked`.
 */
export function Choice({ name, value, checked, onSelect, children }: ChoiceProps) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "eyebrow block border px-5 py-4 transition-colors duration-quick ease-editorial",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          checked
            ? "border-foreground bg-foreground text-primary-foreground"
            : "border-border text-foreground hover:border-foreground",
        )}
      >
        {children}
      </span>
    </label>
  );
}

export function ChoiceGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow mb-1">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
