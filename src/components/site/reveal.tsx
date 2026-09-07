import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

/** Layout effects don't run on the server; fall back so SSR stays silent. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Seconds to wait before this block starts, for staggering siblings. */
  delay?: number;
};

/**
 * Quiet reveal-on-scroll wrapper used across the site.
 *
 * Deliberately CSS-driven rather than animated by Framer Motion, because the
 * hidden state must never reach the server-rendered HTML. Content ships fully
 * visible; the client hides it in a layout effect (before the first paint, so
 * there is no flash) and an IntersectionObserver brings it back as it scrolls
 * into view.
 *
 * The consequence is that content is visible for every reader who does not get
 * the animation, no JavaScript, no IntersectionObserver, reduced motion, or a
 * crawler reading the raw HTML. Body copy at `opacity: 0` in the markup is both
 * a blank page waiting to happen and the kind of hidden text search engines
 * penalise; this shape cannot produce either.
 */
export function Reveal({ children, delay = 0, className, style, ...props }: RevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "shown">("idle");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    /* Anything that would stop the reveal from completing means show the
     * content as-is rather than hide it and hope. */
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;

    /* Already on screen at first paint: no point hiding it just to fade it in. */
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState("shown");
      return;
    }

    /*
     * The backstop.
     *
     * An IntersectionObserver can be outrun: a long flick, a jump to an
     * anchor, or a restored scroll position can all put a block on screen
     * without a callback landing in time, and the failure mode is a reader
     * looking at a blank page. This shows anything that is visible whatever
     * the observer thinks, and it stops as soon as the block is shown, so it
     * costs one bounding-box read per scroll frame for at most a few frames.
     */
    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setState("shown");
      /* Detach immediately. One page carries dozens of these, and dozens of
       * live scroll listeners each reading a bounding box is exactly the kind
       * of thing that makes a site feel slow. */
      window.removeEventListener("scroll", backstop);
      observer.disconnect();
    };
    const backstop = () => {
      if (done) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) finish();
      });
    };
    window.addEventListener("scroll", backstop, { passive: true });

    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        finish();
      },
      /*
       * A whole viewport of margin below, and that is not generous, it is the
       * minimum that works.
       *
       * The root extends 100% of the viewport height past the fold, so a block
       * starts revealing a full screen before it is reached and has finished
       * its 420ms by the time it arrives. Earlier versions used a negative
       * margin (hold until well inside the view) and then 25%, and both left
       * whole sections sitting at opacity 0 while they were on screen,
       * because a single wheel gesture moves further than either margin.
       *
       * The trade is that a reveal now often completes before it is seen,
       * which is the correct trade: the animation is decoration and the
       * content is not.
       */
      { rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", backstop);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-reveal={state === "idle" ? undefined : state}
      style={delay ? { transitionDelay: `${delay}s`, ...style } : style}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
