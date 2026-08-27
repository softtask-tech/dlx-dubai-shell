import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { loadScrollTrigger, scrollMotionAllowed } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useLenis } from "./lenis-provider";

/**
 * A section that holds the viewport and advances through its own stages.
 *
 * This is the one showpiece pattern on the site, and it earns its place in
 * exactly one situation: when a section has an argument to make in a fixed
 * order. The market read is that argument. First the plain-language verdict,
 * then the evidence, then the invitation to go deeper. Pinning lets the reader
 * take those in sequence at their own pace instead of scrolling past them as
 * three unrelated blocks.
 *
 * Because it works by taking the scroll away, it is rationed. Two per page is
 * the ceiling for the whole site, and a page that uses two had better be able
 * to say why.
 *
 * ## What ships to whom
 *
 * The server renders every stage in a normal vertical stack, which is also
 * exactly what a reader on a phone, a reader with reduced motion, and a
 * crawler get. No content is behind the interaction. The pin is applied on the
 * client, above 768px, only when motion is welcome; when it is, the stages
 * become a cross-faded stack and the section holds for the length of the
 * sequence before releasing to whatever comes next.
 */
type PinnedSequenceProps = {
  /** One node per stage, in the order they should be read. */
  stages: readonly ReactNode[];
  /**
   * Drawn once, behind every stage. A pinned section holds a whole viewport
   * still, and whatever the stages do not occupy is read as emptiness rather
   * than as space, so the ground under them has to be something: a photograph,
   * a field of colour, a rule. Without it the pattern looks like a bug.
   */
  backdrop?: ReactNode;
  /**
   * Drawn once, above every stage, and given the sequence's state so it can
   * show where in the argument the reader is. This is the section's frame: the
   * rails that stay put while the content changes, which is what makes the
   * held viewport read as one composition instead of three slides.
   */
  frame?: (state: { active: number; count: number; pinned: boolean }) => ReactNode;
  /**
   * Viewport heights of scroll per stage. Higher means the reader dwells
   * longer on each. Below about 0.8 the sequence feels rushed.
   */
  dwell?: number;
  /** Applied to the outer section in both the pinned and the stacked layout. */
  className?: string;
  /** Applied to each stage wrapper, in both layouts. */
  stageClassName?: string;
  /**
   * Applied to each stage only while the pin holds. Padding belongs here, not
   * in `stageClassName`: room for the frame's rails inside a held viewport is
   * dead space once the stages are three ordinary blocks in a column.
   */
  pinnedStageClassName?: string;
  /** Accessible label for the section landmark. */
  "aria-label"?: string;
};

export function PinnedSequence({
  stages,
  backdrop,
  frame,
  dwell = 1,
  className,
  stageClassName,
  pinnedStageClassName,
  "aria-label": ariaLabel,
}: PinnedSequenceProps) {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || stages.length < 2 || !scrollMotionAllowed(reduced)) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadScrollTrigger(lenis).then(({ ScrollTrigger }) => {
      if (cancelled || !ref.current) return;
      setPinned(true);

      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        /* Pin at the top of the viewport, never at centre. Starting anywhere
         * else means the reader watches the section slide halfway up and stop,
         * which is the single most common way this pattern is got wrong. */
        start: "top top",
        end: () => `+=${window.innerHeight * dwell * (stages.length - 1)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          /* Discrete stages rather than a scrubbed tween: each stage is a
           * complete thought and should be readable while the reader is on it,
           * not a frame in a scrub. The cross-fade itself is a CSS transition. */
          const index = Math.min(
            stages.length - 1,
            Math.floor(self.progress * stages.length * 0.999),
          );
          setActive(index);
        },
      });

      cleanup = () => {
        trigger.kill();
        setPinned(false);
        setActive(0);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, lenis, dwell, stages.length]);

  const frameNode = frame?.({ active, count: stages.length, pinned });

  return (
    <section
      ref={ref}
      aria-label={ariaLabel}
      className={cn("relative", pinned && "min-h-[100dvh] overflow-hidden", className)}
    >
      {backdrop ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {backdrop}
        </div>
      ) : null}

      {/* In the stacked fallback the frame heads the section, so it has to come
          before the stages in the flow. While the pin holds it is an overlay
          and its DOM order only decides paint order, where last is what we
          want. Same node, two positions. */}
      {frame && !pinned ? <div className="relative z-10 pt-section-sm">{frameNode}</div> : null}

      {stages.map((stage, i) => (
        <div
          key={i}
          data-pinned-stage={pinned ? (i === active ? "active" : "idle") : undefined}
          aria-hidden={pinned && i !== active ? true : undefined}
          className={cn(
            "relative",
            pinned
              ? ["absolute inset-0 flex items-center", pinnedStageClassName]
              : /* The stacked fallback. Every stage is a section in its own
                 * right, so it gets section-sized breathing room. */
                "py-section-sm first:pt-section last:pb-section",
            stageClassName,
          )}
        >
          {stage}
        </div>
      ))}

      {/* Inert: the frame is rails and a progress line, never a control, so
          while it lies over the held viewport it must not sit between the
          reader and a link. */}
      {frame && pinned ? (
        <div className="pointer-events-none absolute inset-0 z-10">{frameNode}</div>
      ) : null}
    </section>
  );
}
