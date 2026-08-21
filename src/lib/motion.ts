/**
 * Motion tokens.
 *
 * The brand's motion language is slow, eased and quiet — the same curve
 * everywhere, so the site feels like one hand made it. Import these instead of
 * typing durations and cubic-béziers into components.
 *
 * Every animation built on these must also read `useReducedMotion()` and settle
 * instantly when a visitor has asked for reduced motion.
 */

/** The house easing curve: a long, decelerating settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  /** Hover states and small affordances. */
  quick: 0.4,
  /** Menus, panels, cursor state changes. */
  base: 0.6,
  /** Reveal-on-scroll and section entrances. */
  slow: 1.1,
  /** Hero entrance — the one place a long beat is earned. */
  cinematic: 1.3,
} as const;

/** Distance, in pixels, a revealed block travels upward as it fades in. */
export const REVEAL_DISTANCE = 24;

/** Delay between staggered siblings (an index multiplier). */
export const STAGGER = 0.06;

/**
 * Transition for reveals, collapsing to an instant settle when the visitor
 * prefers reduced motion.
 */
export function revealTransition(reduced: boolean | null, delay = 0) {
  return reduced ? { duration: 0 } : { duration: DURATION.slow, delay, ease: EASE };
}
