import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { useReducedMotion } from "motion/react";

/**
 * Smooth scroll, site-wide.
 *
 * This is the invisible half of the premium feel: a slightly weighted, eased
 * scroll that makes the parallax and the pinned sections read as one continuous
 * camera move rather than a series of jumps. Nothing on the page depends on it,
 * which is the point. Turn it off and the site is identical, just less calm.
 *
 * It stands down completely for anyone who has asked for reduced motion. A
 * hijacked scroll is the single most disorienting thing you can do to a reader
 * with a vestibular sensitivity, and "reduced" is not a suggestion.
 *
 * Everything that needs to react to the scroll subscribes through
 * `useLenis()` rather than listening to the window, so there is one scroll
 * source on the page and no `window.addEventListener("scroll")` anywhere.
 */
const LenisContext = createContext<Lenis | null>(null);

/** Layout effects do not run on the server; fall back so SSR stays silent. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The running Lenis instance, or null when smooth scroll is off (reduced
 * motion, or the server). Consumers must handle null: it is the normal state
 * for a meaningful share of readers.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const firstPath = useRef(pathname);

  useEffect(() => {
    if (reduced) return;

    const instance = new Lenis({
      /* Long enough to feel weighted, short enough that a flick still lands
       * where the reader expected. */
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      /* Touch scrolling is left to the platform. Smoothing it costs frames on
       * exactly the devices that have fewest to spare, and a phone's native
       * scroll already has momentum. */
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      autoRaf: true,
      /* Lenis owns the scroll position, so a browser-driven jump to a fragment
       * would be undone on the next frame. Handing it the anchor clicks makes
       * `href="#faq"` glide to the heading instead of fighting the library. */
      anchors: true,
    });

    setLenis(instance);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  /*
   * Keep Lenis and the router's scroll restoration in agreement.
   *
   * The router sets `scrollTop` directly on navigation. Lenis holds its own
   * idea of where the page is and animates towards it, so without this it
   * would spend the first frames after a navigation dragging the reader back
   * to the previous page's scroll position. Running after the DOM has updated,
   * this adopts whatever the router decided as the new truth.
   */
  useIsomorphicLayoutEffect(() => {
    if (!lenis || pathname === firstPath.current) return;
    lenis.resize();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [lenis, pathname]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
