import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A headline that rises into place one line at a time.
 *
 * Why line by line rather than all at once: a display headline is the thing the
 * reader's eye lands on first, and staggering the lines paces that landing in
 * the order the sentence is meant to be read. It communicates hierarchy, which
 * is the only reason to animate a headline at all.
 *
 * The text ships in the HTML, in full, at full opacity. SplitType rewrites it
 * into per-line spans on the client, in a layout effect, before the first
 * paint of that subtree; if the script never runs, never loads, or the reader
 * has asked for reduced motion, what is on screen is the finished headline.
 * Nothing here can produce a blank heading, and nothing here puts text at
 * `opacity: 0` into the server-rendered markup where a crawler would read it as
 * hidden.
 */
type RevealTextProps = {
  children: ReactNode;
  /** The element to render. Defaults to a div so the caller owns the heading level. */
  as?: ElementType;
  className?: string;
  /** Seconds before the first line starts. */
  delay?: number;
  /** Seconds between consecutive lines. */
  stagger?: number;
};

export function RevealText({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  stagger = 0.09,
}: RevealTextProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let split: { revert: () => void } | undefined;

    /* SplitType is only needed once a reveal is actually going to happen, so
     * it is loaded here rather than bundled into every route that has a
     * headline. */
    void import("split-type").then(({ default: SplitType }) => {
      if (cancelled || !ref.current) return;

      split = new SplitType(ref.current, { types: "lines", tagName: "span" });
      const lines = ref.current.querySelectorAll<HTMLElement>(".line");
      if (lines.length === 0) return;

      lines.forEach((line, i) => {
        /*
         * Two elements per line, not one. The outer `.line` is the clipping
         * edge and never moves; the inner span is what rises. Doing it with a
         * single element would move the clip along with the text, and the
         * whole point of the pattern is the fixed edge the words come out
         * from behind.
         */
        const inner = document.createElement("span");
        inner.className = "line-inner";
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);

        line.style.setProperty("--reveal-delay", `${delay + i * stagger}s`);
        line.dataset["revealLine"] = "pending";
      });

      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          lines.forEach((line) => {
            line.dataset["revealLine"] = "shown";
          });
          observer?.disconnect();
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      observer.observe(ref.current);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      split?.revert();
    };
  }, [reduced, delay, stagger]);

  return (
    <Tag ref={ref} className={cn("reveal-text", className)}>
      {children}
    </Tag>
  );
}
