#!/usr/bin/env node
/**
 * Keep the retired, uncontrolled domain out of tracked source and public copy.
 *
 * Historical migrations are immutable records and are deliberately excluded.
 * Build the rejected values at runtime so this guard does not contain the very
 * literal it is designed to detect.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const retiredDomain = ["dlxproperties", ".ae"].join("");
const retiredEmailDomain = ["@dlxproperties", ".ae"].join("");
const forbidden = [retiredDomain, retiredEmailDomain];

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.startsWith("supabase/migrations/"));

const matches = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8").toLowerCase();
  } catch {
    continue;
  }
  for (const value of forbidden) {
    if (content.includes(value)) matches.push(`${file}: ${value}`);
  }
}

if (matches.length > 0) {
  console.error("Retired DLX domain found in tracked source/public files:");
  for (const match of matches) console.error(`- ${match}`);
  process.exit(1);
}

console.log("domain check passed: tracked source/public files use the approved .com domain");
