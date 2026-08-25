/**
 * The motion vocabulary, in one import.
 *
 * Five pieces, and between them they cover everything the site animates:
 *
 *   LenisProvider   the eased scroll everything else rides on
 *   Reveal          an element rising into view (the workhorse)
 *   RevealText      a headline rising line by line
 *   Parallax        photography and content at different depths
 *   MaskReveal      a photograph uncovering itself
 *   PinnedSequence  a section that holds and advances through stages
 *
 * Every one of them ships its finished state in the server-rendered HTML and
 * animates only as an enhancement, and every one of them stands down under
 * `prefers-reduced-motion`. If you need a sixth, be sure it is a pattern and
 * not a one-off, and be able to say in a sentence what it communicates.
 */
export { LenisProvider, useLenis } from "./lenis-provider";
export { MaskReveal } from "./mask-reveal";
export { Parallax } from "./parallax";
export { PinnedSequence } from "./pinned-sequence";
export { RevealText } from "./reveal-text";
export { Reveal } from "@/components/site/reveal";
