/**
 * The section-layout library.
 *
 * The v2 brief's first diagnosis was that every section on the old page had the
 * same shape: a small uppercase label, a big serif line, a grey sentence, a
 * hairline, repeat. Thirty of those in a column is a document, not a brand, and
 * no amount of good photography fixes it if the photographs all sit in the same
 * rectangle.
 *
 * So the compositions are a library rather than a habit. Seven families, each
 * genuinely different in structure, and the rule that governs them is simple
 * enough to check in a screenshot: **no two consecutive sections may use the
 * same family.**
 *
 *   FullBleed        a photograph the type sits inside
 *   SplitFeature     image one side, editorial the other, sides alternating
 *   EditorialIndex   a list of rows, each with its own thumbnail
 *   DarkAnchor       a green-black band, for data and for the advisor
 *   HorizontalGallery a track the reader moves through sideways
 *   MosaicGrid       cells of deliberately different sizes
 *   Manifesto        type alone, once per page at most
 *
 * They take content, not configuration. None of them accepts a `variant` prop,
 * because a variant prop is how a library turns back into one template.
 */
export { DarkAnchor } from "./dark-anchor";
export { EditorialIndex, type IndexRow } from "./editorial-index";
export { FullBleed } from "./full-bleed";
export { HorizontalGallery } from "./horizontal-gallery";
export { Manifesto } from "./manifesto";
export { MosaicGrid, type MosaicCell } from "./mosaic-grid";
export { SplitFeature } from "./split-feature";
