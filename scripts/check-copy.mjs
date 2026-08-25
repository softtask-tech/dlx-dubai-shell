#!/usr/bin/env node
/**
 * The typography lint.
 *
 * One rule, enforced mechanically, because it is the rule that gets broken by
 * accident: no em-dash, and no en-dash used as a separator.
 *
 * The em-dash is the single clearest signal that a page was written by a
 * language model rather than by a person, and this site's whole argument is
 * that a small brokerage can look like an institution. A page that reads as
 * generated undoes that in one glyph. There is no "sparingly" allowance and
 * no "it is fine in body copy" allowance: a sentence that wants an em-dash
 * wants a comma, a colon, a pair of brackets, or two sentences.
 *
 * The same applies to the en-dash. Ranges take a hyphen.
 *
 *   node scripts/check-copy.mjs
 *
 * Scope is everything that ships: source, in-repo content, and the Edge
 * Functions. Documentation under docs/ and the design playbooks are excluded,
 * because they quote the rule in order to state it.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOTS = ["src", "scripts", "supabase"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".sql", ".json"]);
const SKIP_DIRECTORIES = new Set(["node_modules", ".git", "dist", ".output", ".nitro"]);

/*
 * The banned glyphs, and what to reach for instead.
 *
 * Written as code points rather than literals for the obvious reason: a lint
 * that spells out the character it forbids reports itself on every run.
 */
const BANNED = [
  {
    char: String.fromCharCode(0x2014),
    name: "em-dash",
    instead: "a comma, a colon, brackets, or two sentences",
  },
  { char: String.fromCharCode(0x2013), name: "en-dash", instead: "a hyphen, for ranges" },
];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (EXTENSIONS.has(path.slice(path.lastIndexOf(".")))) {
      yield path;
    }
  }
}

export async function findBannedGlyphs() {
  const hits = [];
  for (const root of ROOTS) {
    for await (const path of walk(root)) {
      const text = await readFile(path, "utf8");
      if (!BANNED.some(({ char }) => text.includes(char))) continue;

      text.split("\n").forEach((line, index) => {
        for (const banned of BANNED) {
          if (!line.includes(banned.char)) continue;
          hits.push({
            file: relative(process.cwd(), path),
            line: index + 1,
            name: banned.name,
            instead: banned.instead,
            text: line.trim().slice(0, 120),
          });
        }
      });
    }
  }
  return hits;
}

async function main() {
  const hits = await findBannedGlyphs();

  if (hits.length === 0) {
    console.log("check-copy: no em-dashes or en-dashes in source.");
    return 0;
  }

  console.log(`check-copy: ${hits.length} banned dash${hits.length === 1 ? "" : "es"}.\n`);
  for (const hit of hits) {
    console.log(`  ${hit.file}:${hit.line}  ${hit.name}, use ${hit.instead}`);
    console.log(`    ${hit.text}`);
  }
  console.log("\nSee DESIGN_OVERHAUL.md, hard bans.");
  return 1;
}

/* Importable by the preflight, runnable on its own. */
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(await main());
}
