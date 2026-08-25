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

    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
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
