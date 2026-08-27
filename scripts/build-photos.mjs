#!/usr/bin/env node
/**
 * Turn the client's photography into what the site can actually serve.
 *
 * The originals are 3 to 9 megapixel JPEGs of 1 to 5 MB each. Shipping those
 * would make a photography-led page slower than a text one, which defeats the
 * point of leading with photography. This produces, for every image and every
 * width the layouts ask for, an AVIF and a WebP, plus one JPEG per image as the
 * last-resort fallback.
 *
 * Run it after dropping new originals into `assets-source/photos`:
 *
 *   node scripts/build-photos.mjs
 *
 * The output in `public/photos` is committed. Nothing resizes at request time.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import sharp from "sharp";

const SOURCE = "assets-source/photos";
const OUT = "public/photos";

/**
 * The widths the layouts actually request.
 *
 * Chosen from the real frames rather than a generic ladder: 640 covers a phone
 * at 2x, 1280 a tablet and a half-width desktop frame, 1920 a full-bleed
 * desktop hero, 2560 the same hero on a retina laptop. A fifth size would be
 * bytes nobody downloads.
 */
const WIDTHS = [640, 1280, 1920, 2560];

/** Quality per format, tuned so an AVIF hero lands around 120KB. */
const QUALITY = { avif: 52, webp: 74, jpeg: 78 };

async function main() {
  await mkdir(OUT, { recursive: true });

  const files = (await readdir(SOURCE)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (files.length === 0) {
    console.log(`no source images in ${SOURCE}`);
    return;
  }

  const manifest = [];
  let bytes = 0;

  for (const file of files) {
    const slug = basename(file, extname(file));
    const original = await readFile(join(SOURCE, file));
    const meta = await sharp(original).metadata();
    const ratio = (meta.width ?? 1) / (meta.height ?? 1);

    for (const width of WIDTHS) {
      /* Never upscale. A 2560 variant of a 1600px original is a bigger file
       * carrying no more detail. */
      if (width > (meta.width ?? 0)) continue;

      const pipeline = sharp(original).resize(width, undefined, { withoutEnlargement: true });

      for (const format of ["avif", "webp"]) {
        const out = join(OUT, `${slug}-${width}.${format}`);
        const buffer = await pipeline.clone()[format]({ quality: QUALITY[format] }).toBuffer();
        await writeFile(out, buffer);
        bytes += buffer.length;
      }
    }

    /* One JPEG, at the middle width, for anything that understands neither
     * AVIF nor WebP. That is a very old browser and it gets a working page,
     * not a perfect one. */
    const fallbackWidth = Math.min(1280, meta.width ?? 1280);
    const jpeg = await sharp(original)
      .resize(fallbackWidth, undefined, { withoutEnlargement: true })
      .jpeg({ quality: QUALITY.jpeg, mozjpeg: true })
      .toBuffer();
    await writeFile(join(OUT, `${slug}-${fallbackWidth}.jpg`), jpeg);
    bytes += jpeg.length;

    manifest.push({
      slug,
      width: meta.width,
      height: meta.height,
      ratio: Number(ratio.toFixed(4)),
      widths: WIDTHS.filter((w) => w <= (meta.width ?? 0)),
      fallbackWidth,
    });
    console.log(`${slug}  ${meta.width}x${meta.height}`);
  }

  await writeFile(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n${manifest.length} photographs, ${(bytes / 1024 / 1024).toFixed(1)} MB emitted`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
