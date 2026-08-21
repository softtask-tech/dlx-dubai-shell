import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { REVEAL_DISTANCE, revealTransition } from "@/lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
};

/**
 * Quiet reveal-on-scroll wrapper used across the site.
 *
 * Under `prefers-reduced-motion` the content starts and stays at its final
 * state — visible immediately, no travel, no fade.
 */
export function Reveal({ children, delay = 0, y = REVEAL_DISTANCE, ...props }: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={revealTransition(reduced, delay)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
