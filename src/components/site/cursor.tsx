import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { DURATION, EASE } from "@/lib/motion";

/**
 * Refined two-part custom cursor: a small dot and a trailing ring.
 *
 * It only engages for a fine pointer on a visitor who has not asked for reduced
 * motion. When it is off, `data-cursor-custom` is absent from the document and
 * the native pointer is restored by the stylesheet — so touch users, keyboard
 * users and anyone with a motion sensitivity always keep a real cursor.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.4 });

  useEffect(() => {
    /* Reduced motion can be turned on mid-session; stand down if it is. */
    if (reduced || !window.matchMedia("(pointer: fine)").matches) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      setHovering(Boolean(target?.closest("a, button, [data-cursor='hover']")));
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reduced, x, y]);

  /* Hiding the native cursor is opt-in, and only once ours is actually drawing. */
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.setAttribute("data-cursor-custom", "");
    return () => root.removeAttribute("data-cursor-custom");
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] hidden md:block">
      <motion.div
        className="absolute h-1 w-1 rounded-full bg-foreground"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute rounded-full border border-accent"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovering ? 56 : 28,
          height: hovering ? 56 : 28,
          opacity: hovering ? 1 : 0.5,
        }}
        transition={{ duration: DURATION.quick, ease: EASE }}
      />
    </div>
  );
}
