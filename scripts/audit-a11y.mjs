#!/usr/bin/env node
/**
 * An accessibility audit over the server-rendered HTML.
 *
 * Not a replacement for axe or for a person with a screen reader, it cannot
 * see contrast, focus order or whether a control makes sense when read aloud.
 * What it does catch is the class of defect that is both invisible in a
 * screenshot and fatal to someone using the site without a mouse or without
 * sight, and that a busy team reintroduces every few weeks: an unlabelled
 * control, an image with no alt, a heading level skipped, a language attribute
 * that lies.
 *
 * Every check here failed at least once on this codebase while it was being
 * written, which is the argument for having it run in CI rather than by memory.
 *
 *   node scripts/audit-a11y.mjs http://127.0.0.1:5599
 */
import { readFile } from "node:fs/promises";

const ORIGIN = process.argv[2] ?? "http://127.0.0.1:5599";

const PAGES = [
  "/",
  "/ar",
  "/ar/contact",
  "/zh",
  "/properties",
  "/market-intelligence",
  "/tools",
  "/guides",
  "/contact",
  "/about",
  "/blog",
];

const problems = [];
const notes = [];
const fail = (page, message) => problems.push(`${page}: ${message}`);
const note = (page, message) => notes.push(`${page}: ${message}`);

/** Attribute lookup that tolerates React's camelCase serialisation. */
function attr(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i");
  return pattern.exec(tag)?.[1];
}

/**
 * The document declares its language and direction.
 *
 * A missing `lang` makes a screen reader pronounce Arabic with an English voice
 *, not merely wrong but unintelligible. A missing `dir` on an RTL page leaves
 * punctuation and numbers in the wrong places.
 */
function checkDocumentLanguage(page, html) {
  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0];
  if (!htmlTag) return fail(page, "no <html> element");

  const lang = attr(htmlTag, "lang");
  const dir = attr(htmlTag, "dir");

  if (!lang) fail(page, "<html> has no lang attribute");
  if (!dir) fail(page, "<html> has no dir attribute");

  const isArabicPath = page === "/ar" || page.startsWith("/ar/");
  if (isArabicPath && dir !== "rtl") fail(page, `an Arabic page declares dir="${dir}"`);
  if (isArabicPath && lang !== "ar") fail(page, `an Arabic page declares lang="${lang}"`);
  if (!isArabicPath && page === "/" && lang !== "en") {
    fail(page, `the English homepage declares lang="${lang}"`);
  }
}

/** Exactly one <h1>, and heading levels that descend without gaps. */
function checkHeadings(page, html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: (match[2] ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));

  const h1s = headings.filter((heading) => heading.level === 1);
  if (h1s.length === 0) fail(page, "no <h1>");
  if (h1s.length > 1) fail(page, `${h1s.length} <h1> elements, a page has one title`);

  for (const heading of headings) {
    if (heading.text.length === 0) fail(page, `an empty <h${heading.level}>`);
  }

  let previous = 0;
  for (const heading of headings) {
    if (previous !== 0 && heading.level > previous + 1) {
      note(
        page,
        `heading level jumps from h${previous} to h${heading.level} ("${heading.text.slice(0, 40)}")`,
      );
    }
    previous = heading.level;
  }
}

/**
 * Every image has an alt attribute, including the decorative ones, which need
 * `alt=""` so a screen reader skips them rather than reading a filename.
 */
function checkImages(page, html) {
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (attr(tag, "alt") === undefined) {
      fail(page, `<img> with no alt attribute: ${tag.slice(0, 90)}…`);
    }
  }
}

/**
 * Every interactive control has an accessible name.
 *
 * A button whose only content is an icon, or a select with no label, is a
 * control a screen reader announces as "button", which tells the listener
 * nothing at all.
 */
function checkControls(page, html) {
  /* Buttons: text content, aria-label, or aria-labelledby. */
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = match[1] ?? "";
    const text = (match[2] ?? "").replace(/<[^>]*>/g, " ").trim();
    const labelled =
      text.length > 0 || /aria-label\s*=/.test(attrs) || /aria-labelledby\s*=/.test(attrs);
    if (!labelled) fail(page, `<button${attrs.slice(0, 60)}> has no accessible name`);
  }

  /* Selects: an aria-label, or a <label for> pointing at their id. */
  const labelFor = new Set(
    [...html.matchAll(/<label\b[^>]*\bfor\s*=\s*"([^"]+)"/gi)].map((match) => match[1]),
  );
  for (const tag of html.match(/<select\b[^>]*>/gi) ?? []) {
    const id = attr(tag, "id");
    const labelled =
      /aria-label\s*=/.test(tag) || /aria-labelledby\s*=/.test(tag) || (id && labelFor.has(id));
    if (!labelled) fail(page, `<select${id ? ` id="${id}"` : ""}> has no accessible name`);
  }

  /* Text inputs, likewise. Hidden inputs and the honeypot are exempt. */
  for (const tag of html.match(/<input\b[^>]*>/gi) ?? []) {
    const type = attr(tag, "type") ?? "text";
    if (["hidden", "submit", "button", "radio", "checkbox"].includes(type)) continue;
    const id = attr(tag, "id");
    const labelled =
      /aria-label\s*=/.test(tag) || /aria-labelledby\s*=/.test(tag) || (id && labelFor.has(id));
    if (!labelled) fail(page, `<input type="${type}"${id ? ` id="${id}"` : ""}> has no label`);
  }
}

/** Landmarks a keyboard user navigates by. */
function checkLandmarks(page, html) {
  if (!/<main\b/i.test(html)) fail(page, "no <main> landmark");
  if (!/class="[^"]*skip-link/.test(html)) fail(page, "no skip link");

  /* Two navs with the same name are indistinguishable in a landmark list. */
  const navNames = [...html.matchAll(/<nav\b([^>]*)>/gi)].map(
    (match) => attr(match[1] ?? "", "aria-label") ?? "(unnamed)",
  );
  const duplicates = navNames.filter((name, index) => navNames.indexOf(name) !== index);
  for (const name of new Set(duplicates)) {
    note(page, `more than one <nav> is labelled "${name}"`);
  }
}

/**
 * Links that open a new tab, or point somewhere else entirely, say so.
 *
 * `rel="noopener"` is a security matter as much as an accessibility one, and
 * it is the single easiest thing to forget on an outbound link.
 */
function checkLinks(page, html) {
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    if (attr(tag, "target") === "_blank" && !(attr(tag, "rel") ?? "").includes("noopener")) {
      fail(page, `a target="_blank" link without rel="noopener": ${tag.slice(0, 80)}…`);
    }
  }

  /* An anchor with neither href nor a role is not reachable by keyboard. */
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]{0,200}?)<\/a>/gi)) {
    const attrs = match[1] ?? "";
    if (!/\bhref\s*=/.test(attrs) && !/\brole\s*=/.test(attrs)) {
      note(page, `<a> with no href, not keyboard reachable: ${attrs.slice(0, 60)}`);
    }
  }
}

/**
 * Text in a different language from the page declares itself.
 *
 * On the translated pages the site marks English fragments, service names,
 * tool names, the "EN" badge, with `lang="en"`, so a screen reader switches
 * voice rather than reading English through an Arabic phoneme set.
 */
function checkInlineLanguage(page, html) {
  if (!page.startsWith("/ar") && !page.startsWith("/zh") && !page.startsWith("/hi")) return;
  const inline = (html.match(/\blang="en"/g) ?? []).length;
  if (inline === 0) {
    note(page, 'no inline lang="en", check that English fragments are marked');
  }
}

/** WCAG relative luminance, for an sRGB hex colour. */
function luminance(hex) {
  const value = parseInt(hex.replace("#", ""), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const [r, g, b] = channels.map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The text colours, checked against the two backgrounds they appear on.
 *
 * Read out of styles.css rather than hard-coded here, so the check follows the
 * tokens instead of drifting from them. This is the check that caught the real
 * one: the brand's slate and gold both sat around 3.1-3.5:1 on white, which is
 * fine for a 44px headline and a failure for every caption and link on the
 * site.
 */
async function checkContrast() {
  let css;
  try {
    css = await readFile("src/styles.css", "utf8");
  } catch {
    return;
  }

  const token = (name) =>
    /^#[0-9a-f]{6}$/i.exec(new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim() ?? "")?.[0];

  const slate = token("slate-readable");
  const sand = token("sand-readable");

  if (!slate || !sand) {
    notes.push(
      "styles: could not read --slate-readable / --sand-readable as hex, contrast unchecked",
    );
    return;
  }

  /* White body, and the soft-sand sections. Small text needs 4.5:1 on both. */
  const backgrounds = [
    ["white", "#FFFFFF"],
    ["the soft-sand sections", "#EDE6DB"],
  ];

  for (const [role, colour] of [
    ["muted text (--slate-readable)", slate],
    ["links and small accent text (--accent)", sand],
  ]) {
    for (const [name, background] of backgrounds) {
      const ratio = contrast(colour, background);
      if (ratio < 4.5) {
        problems.push(
          `styles: ${role} is ${colour} at ${ratio.toFixed(2)}:1 on ${name}, WCAG AA needs 4.5:1 for text under 24px`,
        );
      } else {
        console.log(`  ${role.padEnd(38)} ${ratio.toFixed(2)}:1 on ${name}`);
      }
    }
  }
  console.log("");
}

async function main() {
  console.log(`Auditing ${ORIGIN} for accessibility\n`);
  await checkContrast();

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
    const before = problems.length;

    checkDocumentLanguage(page, html);
    checkHeadings(page, html);
    checkImages(page, html);
    checkControls(page, html);
    checkLandmarks(page, html);
    checkLinks(page, html);
    checkInlineLanguage(page, html);

    const found = problems.length - before;
    console.log(`  ${page.padEnd(24)} ${found === 0 ? "clean" : `${found} problem(s)`}`);
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

  console.log("\n✓ No accessibility problems found in the served HTML.");
  console.log("  Contrast, focus order and screen-reader phrasing still need a person.");
}

await main();
