/**
 * GSAP, loaded only where it is actually used.
 *
 * ScrollTrigger plus the core is around 70KB of JavaScript, and only two or
 * three sections on the whole site need it. Importing it from the root shell
 * would put that on the critical path of every page including the ones that do
 * not animate at all, so it is pulled in on demand instead, from inside the
 * effect of whichever component needs it.
 *
 * The trade is that a pinned section is briefly a plain static section while
 * the chunk arrives. That is the correct failure mode: the content is already
 * laid out and readable, and the pin only matters once the reader has scrolled
 * to it.
 */
import type Lenis from "lenis";

type GsapBundle = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

let pending: Promise<GsapBundle> | null = null;
let bridged: Lenis | null = null;

/**
 * Load GSAP with ScrollTrigger registered, and point ScrollTrigger at the
 * Lenis scroll if one is running.
 *
 * Lenis animates the page's own scroll position rather than transforming a
 * wrapper, so ScrollTrigger reads the right numbers already. What it does not
 * get for free is the timing: ScrollTrigger normally recalculates on the
 * browser's scroll event, which fires after Lenis has moved the page, so
 * pinned content lags the scroll by a frame. Updating it from Lenis's own
 * callback removes the lag.
 *
 * Safe to call from several components; the module resolves once.
 */
export async function loadScrollTrigger(lenis: Lenis | null): Promise<GsapBundle> {
  pending ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([core, plugin]) => {
    core.gsap.registerPlugin(plugin.ScrollTrigger);
    return { gsap: core.gsap, ScrollTrigger: plugin.ScrollTrigger };
  });

  const bundle = await pending;

  if (lenis && bridged !== lenis) {
    bridged = lenis;
    lenis.on("scroll", bundle.ScrollTrigger.update);
  }

  return bundle;
}

/**
 * Below this width the pinned and parallax patterns stand down.
 *
 * A pin on a phone means the reader's thumb scrolls and nothing appears to
 * move, which reads as a broken page rather than as choreography. Mirrors the
 * `md` breakpoint the layouts collapse at.
 */
export const MOTION_MIN_WIDTH = 768;

/** Whether the heavier scroll patterns should run at all in this session. */
export function scrollMotionAllowed(reduced: boolean | null): boolean {
  if (reduced || typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${MOTION_MIN_WIDTH}px)`).matches;
}
