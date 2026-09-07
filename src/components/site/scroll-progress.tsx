import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { useLenis } from "@/components/motion/lenis-provider";

/**
 * How far through the page the reader is, as one gold hairline.
 *
 * The smallest interaction on the site and the one that runs constantly, so it
 * is deliberately the quietest: two pixels, the accent, no numbers, no
 * percentage, no label. It answers "how much of this is left" without being
 * asked, which on a long editorial page is the one thing a scrollbar on a
 * trackpad no longer tells anyone.
 *
 * It reads from Lenis where Lenis is running and from the window where it is
 * not, the same rule the masthead follows, so there is one scroll source.
 *
 * Hidden entirely under reduced motion. A bar that tracks the scroll is not a
 * transition that can be shortened, it is continuous movement pinned to the
 * top of the viewport, and that is exactly what the preference is asking to be
 * spared. Nothing depends on it.
 */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;

    const read = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      /* A page shorter than the viewport has no progress to report. */
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    };

    read();

    if (lenis) {
      const onScroll = () => read();
      lenis.on("scroll", onScroll);
      window.addEventListener("resize", read);
      return () => {
        lenis.off("scroll", onScroll);
        window.removeEventListener("resize", read);
      };
    }

    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [lenis, reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-gold-ink transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
