/**
 * Imports a Dubai Land Department snapshot into Supabase.
 *
 *   node scripts/import-dld-snapshot.mjs transactions ./dld-transactions.csv
 *   node scripts/import-dld-snapshot.mjs rents ./dld-rents.csv
 *
 * This is the one-time snapshot path: download a dataset export from Dubai
 * Pulse (https://www.dubaipulse.gov.ae, "DLD Transactions" and "DLD Rent
 * Contracts"), point this at the file, and the site is running on real data.
 * The scheduled Edge Function keeps it current afterwards.
 *
 * Rows land with provenance = 'dld_open_data', which is what switches the site
 * from describing its figures as illustrative to citing the Dubai Land
 * Department. Nothing else flips that; there is no override.
 *
 * Environment: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * The cleaning here mirrors the Edge Function's, deliberately: the same column
 * aliases, the same coercion, the same validation. A row rejected by one is
 * rejected by the other.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

import { cleanRentRow, cleanTransactionRow, REJECTION_REASONS } from "./dld-clean.mjs";

const [, , datasetArg, filePath] = process.argv;

if (!datasetArg || !filePath || !["transactions", "rents"].includes(datasetArg)) {
  console.error("Usage: node scripts/import-dld-snapshot.mjs <transactions|rents> <file.csv>");
  process.exit(1);
}

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.");
  process.exit(1);
}

/** Splits one CSV line, honouring quoted fields and doubled quotes. */
function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

async function postRows(table, rows) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=provenance,${
      table === "dld_transactions" ? "source_transaction_id" : "source_contract_id"
    }`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        /* Upsert, so re-running an import corrects rows instead of duplicating. */
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
  );

  if (!response.ok) {
    throw new Error(`Upsert failed (${response.status}): ${await response.text()}`);
  }
}

async function callFunction(name) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`${name} failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  const table = datasetArg === "transactions" ? "dld_transactions" : "dld_rent_contracts";
  const clean = datasetArg === "transactions" ? cleanTransactionRow : cleanRentRow;

  const reader = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let headers = null;
  let batch = [];
  let fetched = 0;
  let upserted = 0;
  const rejected = new Map();

  const flush = async () => {
    if (batch.length === 0) return;
    await postRows(table, batch);
    upserted += batch.length;
    batch = [];
    process.stdout.write(`\r  upserted ${upserted}…`);
  };

  for await (const line of reader) {
    if (!line.trim()) continue;

    if (!headers) {
      headers = parseCsvLine(line).map((header) => header.trim());
      continue;
    }

    fetched += 1;
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));

    const result = clean(record);
    if (!result.ok) {
      rejected.set(result.reason, (rejected.get(result.reason) ?? 0) + 1);
      continue;
    }

    batch.push(result.row);
    if (batch.length >= 500) await flush();
  }

  await flush();
  process.stdout.write("\n");

  console.log(`\nRead ${fetched} rows, upserted ${upserted}.`);
  if (rejected.size > 0) {
    console.log("Rejected:");
    for (const [reason, count] of [...rejected].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count.toString().padStart(7)}  ${REJECTION_REASONS[reason] ?? reason}`);
    }
  }

  console.log("\nResolving community names…");
  const linked = await callFunction("link_transactions_to_areas");
  console.log(`  linked ${linked} rows to communities.`);

  console.log("Recomputing area statistics…");
  const refreshed = await callFunction("refresh_area_stats");
  console.log(`  refreshed ${refreshed} communities.`);
  console.log("\nDone. The site now cites the Dubai Land Department.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
