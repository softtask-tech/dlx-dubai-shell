import type { ReactNode } from "react";

import { CountUp } from "./count-up";
import { Eyebrow } from "@/components/ui/section";

/**
 * One headline number, with the sentence that makes it mean something.
 *
 * The golden rule is that a figure never appears alone: `meaning` is the
 * plain-English "what this means for you" line, and it is required rather than
 * optional so a stat cannot ship without one.
 */
export function Stat({
  label,
  value,
  meaning,
  decimals = 0,
  prefix = "",
  suffix = "",
  fallback = "-",
}: {
  label: string;
  value: number | null;
  meaning: ReactNode;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fallback?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <Eyebrow>{label}</Eyebrow>
      <p className="display-2">
        <CountUp
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          fallback={fallback}
        />
      </p>
      <p className="caption max-w-measure">{meaning}</p>
    </div>
  );
}
