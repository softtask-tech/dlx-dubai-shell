/**
 * Generates the site's Open Graph cards — one per page, guide and tool.
 *
 *   node scripts/generate-og.mjs
 *
 * Cards are rendered from the same registries the site uses (`src/config/pages.ts`,
 * `src/data/guides.ts`, `src/data/tools.ts`), so a card can never describe a page
 * differently from its own meta tags. Output is written to `public/og/…png` at
 * 1200×630 and committed, so serving them needs no runtime image service.
 *
 * Journal posts are the exception: their copy lives in the database and is
 * written after this script runs, so a post uses the image the editor set, then
 * its hero, then the section card. That chain is in `src/routes/blog/$slug.tsx`.
 *
 * Requires: a Chromium binary (set CHROMIUM_PATH, or let the script find the
 * Playwright-managed one) and network access to Google Fonts, which is used
 * once at generation time to embed the brand faces into the template.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { brand } from "../src/config/brand.ts";
import { SITE_PAGES, ogImagePathFor } from "../src/config/pages.ts";
import { GUIDES, GUIDE_CATEGORY_LABELS, guideOgPath } from "../src/data/guides.ts";
import { SERVICES, serviceOgPath } from "../src/data/services.ts";
import { TOOLS, toolOgPath } from "../src/data/tools.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "og");
const WIDTH = 1200;
const HEIGHT = 630;

/* Brand tokens, mirroring src/styles.css. */
const INK = "#000000";
const PAPER = "#FFFFFF";
const SLATE = "#8A8A8A";
const SAND = "#B08D4C";
const SOFT_SAND = "#EDE6DB";

const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400&display=swap";

/**
 * Finds a browser to drive, preferring `headless_shell`.
 *
 * This matters for geometry: full Chrome in new-headless mode treats
 * `--window-size` as the *window*, so the viewport comes out ~85px shorter and
 * the bottom of the card is cut off. The headless shell treats it as the
 * viewport, giving an exact 1200×630 frame.
 */
function findBrowser() {
  const shellCandidates = [];
  const chromeCandidates = [];

  if (process.env.CHROMIUM_PATH) {
    return {
      bin: process.env.CHROMIUM_PATH,
      isShell: /headless_shell/.test(process.env.CHROMIUM_PATH),
    };
  }

  const browsersRoot = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (existsSync(browsersRoot)) {
    for (const entry of readdirSync(browsersRoot)) {
      const dir = join(browsersRoot, entry, "chrome-linux");
      const shell = join(dir, "headless_shell");
      const chrome = join(dir, "chrome");
      if (existsSync(shell)) shellCandidates.push(shell);
      else if (existsSync(chrome)) chromeCandidates.push(chrome);
    }
  }

  for (const candidate of ["/usr/bin/chromium", "/usr/bin/google-chrome"]) {
    if (existsSync(candidate)) chromeCandidates.push(candidate);
  }

  if (shellCandidates.length) return { bin: shellCandidates[0], isShell: true };
  if (chromeCandidates.length) {
    console.warn(
      "No headless_shell found — falling back to full Chrome, whose viewport is shorter than\n" +
        "the window, so cards may be cropped. Install Playwright's chromium-headless-shell for exact output.",
    );
    return { bin: chromeCandidates[0], isShell: false };
  }

  throw new Error("No Chromium found. Install Chrome/Chromium or set CHROMIUM_PATH to its binary.");
}

/**
 * Downloads the brand faces and inlines them as data URIs. Chromium renders the
 * template from a local file with no network, so the fonts must travel with it.
 */
async function inlineFontCss() {
  const cssResponse = await fetch(FONT_CSS_URL, {
    /* Google serves woff2 only to browser-like clients. */
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120" },
  });
  if (!cssResponse.ok) {
    throw new Error(`Could not fetch Google Fonts CSS: ${cssResponse.status}`);
  }
  let css = await cssResponse.text();

  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  const encoded = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not fetch font ${url}: ${res.status}`);
      const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
      return [url, `data:font/woff2;base64,${base64}`];
    }),
  );

  for (const [url, dataUri] of encoded) css = css.replaceAll(url, dataUri);
  return css;
}

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The card: a wide sand rule, the DLX monogram, the page label as an eyebrow,
 * the tagline set large in the editorial serif, and the licence line. Same
 * restraint as the site — type, whitespace, one accent.
 */
function cardHtml({ label, tagline, fontCss }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
${fontCss}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
body {
  background: ${PAPER};
  color: ${INK};
  font-family: "Jost", sans-serif;
  font-weight: 300;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 72px 88px;
  position: relative;
  overflow: hidden;
}
/* A single soft-sand field, bled off the right edge, for depth without noise. */
.field {
  position: absolute;
  top: 0;
  right: 0;
  width: 34%;
  height: 100%;
  background: ${SOFT_SAND};
  opacity: 0.55;
}
.row { position: relative; display: flex; align-items: baseline; justify-content: space-between; }
.monogram { font-family: "Cormorant Garamond", serif; font-size: 40px; letter-spacing: 0.3em; }
.eyebrow {
  font-size: 15px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: ${SLATE};
}
.tagline {
  position: relative;
  font-family: "Cormorant Garamond", serif;
  font-weight: 300;
  font-size: 82px;
  line-height: 1.06;
  letter-spacing: -0.015em;
  max-width: 15ch;
}
.tagline em { font-style: italic; color: ${SAND}; }
.rule { position: relative; width: 96px; height: 2px; background: ${SAND}; margin-bottom: 34px; }
.licence { position: relative; font-size: 15px; letter-spacing: 0.18em; text-transform: uppercase; color: ${SLATE}; }
</style>
</head>
<body>
  <div class="field"></div>
  <div class="row">
    <span class="monogram">${escapeHtml(brand.shortName)}</span>
    <span class="eyebrow">${escapeHtml(label)}</span>
  </div>
  <div>
    <div class="rule"></div>
    <h1 class="tagline">${escapeHtml(tagline)}</h1>
  </div>
  <div class="row">
    <span class="licence">${escapeHtml(`${brand.address.locality} · RERA ORN ${brand.reraOrn}`)}</span>
    <span class="eyebrow">${escapeHtml(brand.domain)}</span>
  </div>
</body>
</html>`;
}

/**
 * Every card to draw: the registered pages, then one per service, guide and
 * tool.
 *
 * The label is the section the reader is in and the tagline is the page's own
 * standfirst — the same line the page shows and the same line its `og:image:alt`
 * carries, which is what keeps card and page honest with each other.
 */
function cards() {
  return [
    ...SITE_PAGES.map((page) => ({
      path: ogImagePathFor(page.path),
      /* "Home" is a navigation word, not a share-card word. */
      label: page.path === "/" ? "Private Brokerage" : page.label,
      tagline: page.tagline,
    })),
    ...SERVICES.map((service) => ({
      path: serviceOgPath(service.slug),
      label: "Service",
      tagline: service.tagline,
    })),
    ...GUIDES.map((guide) => ({
      path: guideOgPath(guide.slug),
      label: GUIDE_CATEGORY_LABELS[guide.category],
      tagline: guide.tagline,
    })),
    ...TOOLS.map((tool) => ({
      path: toolOgPath(tool.slug),
      label: "Calculator",
      tagline: tool.tagline,
    })),
  ];
}

async function main() {
  const { bin, isShell } = findBrowser();
  console.log(`Browser: ${bin}`);

  const fontCss = await inlineFontCss();
  console.log("Embedded brand fonts.");

  mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = join(ROOT, "node_modules", ".cache", "og");
  mkdirSync(tmpDir, { recursive: true });

  for (const [index, card] of cards().entries()) {
    const outPath = join(ROOT, "public", card.path.replace(/^\//, ""));
    mkdirSync(dirname(outPath), { recursive: true });
    const htmlPath = join(tmpDir, `card-${index}.html`);

    writeFileSync(
      htmlPath,
      cardHtml({ label: card.label, tagline: card.tagline, fontCss }),
      "utf8",
    );

    execFileSync(
      bin,
      [
        ...(isShell ? [] : ["--headless=new"]),
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${outPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: "pipe" },
    );

    console.log(`  ✓ ${card.path}`);
  }

  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`\nWrote ${cards().length} cards to public/og/.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
