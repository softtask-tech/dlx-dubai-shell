/**
 * Trim the transparent margin off the logo-kit PNGs.
 *
 * The kit files are delivered on a generous square-ish canvas: the monogram's
 * ink fills 53% of its 1024px box and the primary lockup's fills 62% of its
 * height. That padding is invisible but not free, because every place the mark
 * is sized by CSS height is really sizing the padding too. In the masthead it
 * made the wordmark line under the monogram render about two pixels tall.
 *
 * So we trim to the ink bounds once, at build time, and let the layout size the
 * mark itself. The ratios in `wordmark.tsx` must match the trimmed files, which
 * is why this prints them.
 *
 * Run with sharp available:  npm i -D sharp && node scripts/trim-brand.mjs
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = "src/assets/brand";

for (const file of (await readdir(DIR)).filter((f) => f.endsWith(".png"))) {
  const from = path.join(DIR, file);
  const image = sharp(from);
  const before = await image.metadata();
  const buffer = await image.trim({ threshold: 10 }).png({ compressionLevel: 9 }).toBuffer();
  const after = await sharp(buffer).metadata();
  await sharp(buffer).toFile(from);
  console.log(
    `${file}: ${before.width}x${before.height} -> ${after.width}x${after.height} ` +
      `(ratio ${(after.width / after.height).toFixed(3)})`,
  );
}
