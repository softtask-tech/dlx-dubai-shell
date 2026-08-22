import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { DURATION } from "@/lib/motion";

/**
 * A number that counts up when it scrolls into view.
 *
 * Server-renders its final value, so the figure is in the HTML for crawlers and
 * for anyone whose JavaScript never arrives — the animation is decoration laid
 * over a number that is already correct. Under reduced motion it simply is the
 * final value and never moves.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  /** Rendered instead of the number when there is nothing to show. */
  fallback = "—",
}: {
  value: number | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fallback?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | null>(value);

  useEffect(() => {
    if (value === null || reduced) {
      setDisplay(value);
      return;
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const durationMs = DURATION.cinematic * 1000;
        const start = performance.now();
        setDisplay(0);

        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          /* Ease-out cubic: fast at first, settling rather than stopping. */
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) frame = requestAnimationFrame(step);
          else setDisplay(value);
        };
        frame = requestAnimationFrame(step);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reduced]);

  if (value === null) {
    return <span ref={ref}>{fallback}</span>;
  }

  const formatted = (display ?? value).toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
