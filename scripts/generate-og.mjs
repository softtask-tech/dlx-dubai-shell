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
import { LOCALISED_PATHS, PREFIXED_LOCALES, ogImagePathForLocale } from "../src/config/locales.ts";
import { ar } from "../src/i18n/ar.ts";
import { hi } from "../src/i18n/hi.ts";
import { ru } from "../src/i18n/ru.ts";
import { zh } from "../src/i18n/zh.ts";

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
 * The extra face each non-Latin card needs, and the stack it is set in.
 *
 * The live site lets Chinese fall back to the reader's system face, which is
 * right in a browser and impossible here: this container has no CJK font, so a
 * Chinese card would render as a row of empty boxes. A card is generated once
 * and served as a PNG, so the weight of embedding a real face costs a visitor
 * nothing — the reasoning that applies to the stylesheet does not apply here.
 */
const LOCALE_FONTS = {
  ar: {
    css: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",
    display: '"Amiri", serif',
    body: '"Amiri", serif',
  },
  hi: {
    css: "https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@300;400&family=Noto+Sans+Devanagari:wght@300;400&display=swap",
    display: '"Noto Serif Devanagari", serif',
    body: '"Noto Sans Devanagari", sans-serif',
  },
  ru: {
    /* Cormorant carries Cyrillic; only the sans needs replacing. */
    css: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400&display=swap",
    display: '"Cormorant Garamond", serif',
    body: '"Noto Sans", sans-serif',
  },
  zh: {
    css: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400&family=Noto+Sans+SC:wght@300;400&display=swap",
    display: '"Noto Serif SC", serif',
    body: '"Noto Sans SC", sans-serif',
  },
};

const DICTIONARIES = { ar, hi, ru, zh };

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
async function inlineFontCss(url = FONT_CSS_URL) {
  const cssResponse = await fetch(url, {
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
function cardHtml({ label, tagline, fontCss, dir = "ltr", lang = "en", display, body }) {
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
/* The monogram is a Latin mark in every language — it is the logo. */
.monogram { font-family: "Cormorant Garamond", serif; font-size: 40px; letter-spacing: 0.3em; }
.eyebrow {
  font-family: ${body ?? '"Jost", sans-serif'};
  font-size: 15px;
  /* Uppercasing and wide tracking are Latin devices. Arabic and Chinese have no
   * case, and tracking Arabic apart breaks the joins between its letters. */
  letter-spacing: ${lang === "ar" ? "0.06em" : lang === "zh-Hans" ? "0.12em" : "0.24em"};
  text-transform: ${lang === "en" || lang === "ru" ? "uppercase" : "none"};
  color: ${SLATE};
}
.tagline {
  position: relative;
  font-family: ${display ?? '"Cormorant Garamond", serif'};
  font-weight: 300;
  /* Arabic and Devanagari carry more ink at the same nominal size, and Chinese
   * says the same thing in a third of the characters — so each script gets the
   * size that fills the card rather than one number that suits Latin. */
  font-size: ${lang === "zh-Hans" ? 88 : lang === "ar" ? 74 : lang === "hi" ? 66 : 82}px;
  line-height: ${lang === "hi" ? 1.35 : lang === "ar" ? 1.5 : 1.06};
  letter-spacing: ${lang === "en" || lang === "ru" ? "-0.015em" : "0"};
  max-width: ${lang === "zh-Hans" ? 13 : 15}ch;
}
.tagline em { font-style: italic; color: ${SAND}; }
.rule { position: relative; width: 96px; height: 2px; background: ${SAND}; margin-bottom: 34px; }
.licence {
  position: relative;
  font-family: ${body ?? '"Jost", sans-serif'};
  font-size: 15px;
  letter-spacing: ${lang === "ar" ? "0.06em" : "0.18em"};
  text-transform: ${lang === "en" || lang === "ru" ? "uppercase" : "none"};
  color: ${SLATE};
}
</style>
</head>
<body dir="${dir}" lang="${lang}">
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
    <span class="licence" dir="ltr">${escapeHtml(`${brand.address.locality} · RERA ORN ${brand.reraOrn}`)}</span>
    <span class="eyebrow" dir="ltr">${escapeHtml(brand.domain)}</span>
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
    /*
     * One card per translated page, per language.
     *
     * The card sets the page's tagline at 82px. A shared Arabic page whose card
     * reads "Dubai real estate, handled with intention." is a WhatsApp preview
     * that says, before anyone opens it, that the Arabic is a veneer — and
     * WhatsApp is how a Gulf buyer shares a property with their family.
     *
     * The label and tagline both come from that language's dictionary, so the
     * card, the <title> and the og:image:alt all carry the same sentence.
     */
    ...LOCALISED_PATHS.flatMap((path) =>
      PREFIXED_LOCALES.map((locale) => {
        const dictionary = DICTIONARIES[locale.code];
        const meta = dictionary.meta[path];
        const fonts = LOCALE_FONTS[locale.code];
        return {
          path: ogImagePathForLocale(path, locale.code, ogImagePathFor(path)),
          label: path === "/" ? dictionary.home.eyebrow : dictionary.nav[navKeyFor(path)],
          tagline: meta.tagline,
          locale: locale.code,
          dir: locale.dir,
          lang: locale.htmlLang,
          display: fonts.display,
          body: fonts.body,
        };
      }),
    ),
  ];
}

/** Which nav label names this page, for the card's eyebrow. */
function navKeyFor(path) {
  return { "/about": "about", "/services": "services", "/tools": "tools", "/contact": "contact" }[
    path
  ];
}

async function main() {
  const { bin, isShell } = findBrowser();
  console.log(`Browser: ${bin}`);

  const latinCss = await inlineFontCss();
  console.log("Embedded brand fonts.");

  /*
   * The script faces, fetched once each and reused across that language's five
   * cards. Every card also carries the Latin pair: the monogram, the domain and
   * the licence line are Latin in all five languages.
   */
  const scriptCss = {};
  for (const [code, config] of Object.entries(LOCALE_FONTS)) {
    scriptCss[code] = `${latinCss}\n${await inlineFontCss(config.css)}`;
    console.log(`Embedded ${code} fonts.`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = join(ROOT, "node_modules", ".cache", "og");
  mkdirSync(tmpDir, { recursive: true });

  for (const [index, card] of cards().entries()) {
    const outPath = join(ROOT, "public", card.path.replace(/^\//, ""));
    mkdirSync(dirname(outPath), { recursive: true });
    const htmlPath = join(tmpDir, `card-${index}.html`);

    writeFileSync(
      htmlPath,
      cardHtml({
        label: card.label,
        tagline: card.tagline,
        fontCss: card.locale ? scriptCss[card.locale] : latinCss,
        ...(card.dir ? { dir: card.dir } : {}),
        ...(card.lang ? { lang: card.lang } : {}),
        ...(card.display ? { display: card.display } : {}),
        ...(card.body ? { body: card.body } : {}),
      }),
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
