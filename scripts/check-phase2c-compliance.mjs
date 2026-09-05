#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const corporateNumber = ["40", "905"].join("");
const corporateField = ["rera", "Orn"].join("");
const roots = ["src/", "public/", "scripts/", "supabase/functions/"];
const allowed = new Set(["src/config/brand.ts", "src/routes/privacy.tsx"]);
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((file) => roots.some((root) => file.startsWith(root)))
  .filter((file) => !file.startsWith("supabase/migrations/"));

const failures = [];
for (const file of files) {
  if (allowed.has(file)) continue;
  let value;
  try {
    value = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (value.includes(corporateNumber) || value.includes(corporateField)) failures.push(file);
}

const commercial = readFileSync("src/data/off-plan.ts", "utf8");
for (const field of [
  "officeRegistrationNumber",
  "responsibleBrokerBrn",
  "advertisementPermitNumber",
  "authorityIssuedQrAsset",
  "permitValidTo",
  "sourceUpdatedAt",
  "validationStatus",
]) {
  if (!commercial.includes(field)) failures.push(`missing commercial compliance field: ${field}`);
}
const directory = readFileSync("src/components/directory/directory-page.tsx", "utf8");
if (/\.from\(["'`]dld_/i.test(directory))
  failures.push("directory browser component queries an internal table");

if (failures.length) {
  console.error("Phase 2C compliance check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(
  "Phase 2C compliance check passed: corporate identifier is confined to controlled disclosure and commercial fields remain separate.",
);
