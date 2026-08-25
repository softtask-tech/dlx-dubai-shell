#!/usr/bin/env node
/**
 * A performance audit that runs without a browser.
 *
 * This is deliberately not a Lighthouse score. Lighthouse needs a real browser
 * on a real network and gives a number that moves with the weather; what this
 * checks instead are the handful of structural mistakes that reliably cause a
 * Core Web Vitals failure, every one of which is visible in the served HTML and
 * the built assets:
 *
 *   LCP, is the largest text candidate actually painted by the server, or is
 *         it sitting at opacity 0 waiting for JavaScript? This is the check
 *         that caught the real bug in this phase: the homepage H1 shipped
 *         hidden and only appeared after hydration, so LCP was measuring bundle
 *         download time rather than page render time.
 *
 *   CLS, does every image declare its dimensions, or reserve space some other
 *         way? An image that arrives without a box pushes the page down under
 *         the reader's thumb.
 *
 *   Weight, how much JavaScript and CSS the browser must fetch, and how much
 *         of it blocks rendering.
 *
 * Run against the dev server or a preview:
 *   node scripts/audit-performance.mjs http://127.0.0.1:5599
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const ORIGIN = process.argv[2] ?? "http://127.0.0.1:5599";

/** The pages worth auditing: one of each shape the site has. */
const PAGES = ["/", "/ar", "/properties", "/market-intelligence", "/tools", "/guides", "/contact"];

/** Budgets. Deliberately generous. These are failure thresholds, not targets. */
const BUDGET = {
  htmlKb: 250,
  /* What a first visit pulls before the page is interactive. React, the router
   * and Framer Motion are most of it and are inherent to the stack. */
  clientJsGzipKb: 320,
  cssGzipKb: 30,
  /*
   * Four, not three, because a translated page legitimately loads one more: the
   * Latin pair plus the face its own script is set in. Setting Arabic in a real
   * Naskh face rather than a system fallback is worth one request, and it is
   * only requested on the pages written in Arabic.
   *
   * In development TanStack injects a stylesheet of its own, so the dev server
   * reports one more than production on every page.
   */
  renderBlockingStylesheets: 4,
};

const problems = [];
const notes = [];

function fail(page, message) {
  problems.push(`${page}: ${message}`);
}

function note(page, message) {
  notes.push(`${page}: ${message}`);
}

/**
 * The first heading's markup, and whether the server painted it.
 *
 * An inline `opacity:0` or `visibility:hidden` on or around the H1 means the
 * element is invisible until something else runs. Chrome does not count a
 * zero-opacity element towards LCP, so this is not a cosmetic detail.
 */
function checkHeroPaints(page, html) {
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (!h1) {
    note(page, "no <h1> found, nothing to measure for LCP");
    return;
  }

  /* Look at the H1 and the 600 characters before it: an ancestor set to
   * opacity 0 hides it just as effectively as the element itself. */
  const start = Math.max(0, h1.index - 600);
  const region = html.slice(start, h1.index + h1[0].length);

  if (/opacity\s*:\s*0(?![.\d])/.test(region)) {
    fail(page, "the <h1> or an ancestor is server-rendered at opacity:0, LCP waits for hydration");
  }
  if (/visibility\s*:\s*hidden/.test(region)) {
    fail(page, "the <h1> or an ancestor is server-rendered visibility:hidden");
  }
  if (h1[1].replace(/<[^>]*>/g, "").trim().length === 0) {
    fail(page, "the <h1> is empty in the server-rendered HTML");
  }
}

/** Every <img> should either declare width and height or sit in a sized box. */
function checkImages(page, html) {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const img of imgs) {
    const hasDimensions = /\bwidth=/.test(img) && /\bheight=/.test(img);
    /* `h-full w-full` inside an aspect-ratio parent is the other valid way to
     * reserve space, and it is what the gallery and card media use. */
    const fillsParent = /class(?:Name)?="[^"]*\bh-full\b[^"]*\bw-full\b/.test(img);
    if (!hasDimensions && !fillsParent) {
      const src = /src="([^"]{0,60})/.exec(img)?.[1] ?? "unknown";
      fail(
        page,
        `<img src="${src}…"> has no width/height and does not fill a sized parent, CLS risk`,
      );
    }

    const isHero = /fetchPriority="high"|fetchpriority="high"/i.test(img);
    if (!isHero && !/loading="lazy"/.test(img)) {
      const src = /src="([^"]{0,60})/.exec(img)?.[1] ?? "unknown";
      note(page, `<img src="${src}…"> is not lazy-loaded and is not the hero`);
    }
  }
}

/** Stylesheets in <head> block the first paint. Count them. */
function checkRenderBlocking(page, html) {
  const head = /<head\b[\s\S]*?<\/head>/i.exec(html)?.[0] ?? html;
  const sheets = head.match(/<link\b[^>]*rel="stylesheet"[^>]*>/gi) ?? [];
  if (sheets.length > BUDGET.renderBlockingStylesheets) {
    fail(
      page,
      `${sheets.length} render-blocking stylesheets in <head> (budget ${BUDGET.renderBlockingStylesheets})`,
    );
  }
  return sheets.length;
}

/**
 * The gzipped size of every built asset, by filename.
 *
 * Used to price what a page's HTML actually asks the browser to fetch, which is
 * the only weight that matters. Two earlier versions of this function got it
 * wrong in ways worth recording: the first summed the whole assets directory
 * (387 kB, the entire site including the admin and all eight calculators, which
 * no visitor downloads), and the second guessed the entry chunk by filename and
 * picked a Supabase chunk. The HTML knows; ask it.
 */
async function assetSizes() {
  const dir = ".output/public/assets";
  const sizes = new Map();
  let files = [];

  try {
    files = await readdir(dir);
  } catch {
    return null;
  }

  for (const name of files) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) continue;
    sizes.set(name, gzipSync(await readFile(path)).length);
  }

  return sizes;
}

/**
 * What this page's HTML tells the browser to download.
 *
 * Module scripts and modulepreloads together are the JavaScript a visitor pulls
 * before the page is interactive. Stylesheets served from our own origin are
 * counted too; Google's font CSS is not, because it is on someone else's origin
 * and its size is not ours to measure from here.
 */
function referencedAssets(html) {
  const names = new Set();
  for (const match of html.matchAll(/(?:src|href)="\/assets\/([A-Za-z0-9_.-]+)"/g)) {
    if (match[1]) names.add(match[1]);
  }
  return names;
}

async function main() {
  console.log(`Auditing ${ORIGIN}\n`);

  const sizes = await assetSizes();
  if (!sizes) console.log("  (no build found, run `npm run build` to price the assets)\n");

  for (const page of PAGES) {
    let response;
    try {
      response = await fetch(`${ORIGIN}${page}`);
    } catch (error) {
      fail(page, `could not be fetched (${String(error)})`);
      continue;
    }

    if (!response.ok) {
      fail(page, `responded ${response.status}`);
      continue;
    }

    const html = await response.text();
    const kb = Buffer.byteLength(html) / 1024;
    if (kb > BUDGET.htmlKb) fail(page, `HTML is ${kb.toFixed(0)} kB (budget ${BUDGET.htmlKb} kB)`);

    checkHeroPaints(page, html);
    checkImages(page, html);
    const sheets = checkRenderBlocking(page, html);

    let weight = "";
    if (sizes) {
      let js = 0;
      let css = 0;
      for (const name of referencedAssets(html)) {
        const gz = sizes.get(name) ?? 0;
        if (name.endsWith(".js")) js += gz;
        else if (name.endsWith(".css")) css += gz;
      }
      const jsKb = js / 1024;
      const cssKb = css / 1024;
      weight = ` · ${jsKb.toFixed(0)} kB JS + ${cssKb.toFixed(0)} kB CSS`;

      if (jsKb > BUDGET.clientJsGzipKb) {
        fail(
          page,
          `pulls ${jsKb.toFixed(0)} kB of gzipped JS (budget ${BUDGET.clientJsGzipKb} kB)`,
        );
      }
      if (cssKb > BUDGET.cssGzipKb) {
        fail(page, `pulls ${cssKb.toFixed(0)} kB of gzipped CSS (budget ${BUDGET.cssGzipKb} kB)`);
      }
      if (jsKb === 0) {
        /*
         * The dev server serves source modules, not built chunks, so there is
         * nothing to price. `vite preview` cannot stand in either: this build
         * targets Cloudflare Workers and nitro writes to .output/server, which
         * the preview plugin does not look for. Weight is therefore checked
         * from the build output below rather than per page, and the structural
         * checks above, which are the ones that actually decide LCP and CLS,
         * run against whichever server is up.
         */
        weight = "";
      }
    }

    console.log(
      `  ${page.padEnd(24)} ${kb.toFixed(0).padStart(4)} kB HTML · ${sheets} stylesheets${weight}`,
    );
  }

  if (sizes) {
    let js = 0;
    let css = 0;
    for (const [name, gz] of sizes) {
      if (name.endsWith(".js")) js += gz;
      else if (name.endsWith(".css")) css += gz;
    }
    console.log(
      `\n  build inventory           ${(js / 1024).toFixed(0)} kB JS + ${(css / 1024).toFixed(0)} kB CSS gzipped, across ${sizes.size} files`,
    );
    console.log(
      "                            (the whole site, every route, a visitor downloads the shared",
    );
    console.log("                             chunks plus the one route they opened)");

    if (css / 1024 > BUDGET.cssGzipKb) {
      fail(
        "bundle",
        `${(css / 1024).toFixed(0)} kB of gzipped CSS (budget ${BUDGET.cssGzipKb} kB)`,
      );
    }
  }

  if (notes.length > 0) {
    console.log(`\nNotes (${notes.length}):`);
    for (const message of notes) console.log(`  · ${message}`);
  }

  if (problems.length > 0) {
    console.log(`\nProblems (${problems.length}):`);
    for (const message of problems) console.log(`  ✗ ${message}`);
    process.exit(1);
  }

  console.log("\n✓ No structural performance problems found.");
}

await main();
