/**
 * Generates the sample market dataset.
 *
 *   node scripts/generate-market-sample.mjs > supabase/seed/market-sample.sql
 *
 * WHY THIS EXISTS, AND WHAT IT IS NOT.
 *
 * The site's market pages are only worth anything if the numbers behind them
 * are real Dubai Land Department records. Until those are loaded, the pages
 * would be empty — so this produces a plausible dataset to develop and demo
 * against, written with `provenance = 'sample'`.
 *
 * That column is not decoration. Every page derives its source line from it,
 * so while this data is in the database the site says the figures are
 * illustrative and does NOT cite the Dubai Land Department. Publishing invented
 * numbers under an official attribution would be a serious thing to get wrong;
 * the provenance column is what makes it structurally impossible rather than a
 * matter of remembering.
 *
 * Loading real DLD data (see scripts/import-dld-snapshot.mjs) writes rows with
 * `provenance = 'dld_open_data'`, and from that moment the metrics ignore these
 * rows entirely and the pages cite DLD.
 *
 * The generator is deterministic — same output every run — so the committed SQL
 * is reviewable and diffs are meaningful.
 */

/** Mulberry32: small, fast, seeded. Determinism is the point. */
function makeRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260822);

/** Box–Muller, so sizes and prices cluster like real ones rather than sitting flat. */
function normal(mean, deviation) {
  const u = Math.max(random(), Number.EPSILON);
  const v = random();
  return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pick(items) {
  return items[Math.floor(random() * items.length)];
}

/**
 * The communities. `basePpsf` is the price per square foot the series starts
 * from three years ago, `drift` the annual trend, `rentYield` the gross yield
 * the rent contracts are generated to imply.
 */
const AREAS = [
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    dld: "Palm Jumeirah",
    basePpsf: 2450,
    drift: 0.14,
    rentYield: 0.048,
    lat: 25.1124,
    lng: 55.139,
    types: ["Villa", "Apartment", "Penthouse"],
  },
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    dld: "Burj Khalifa",
    basePpsf: 2050,
    drift: 0.11,
    rentYield: 0.061,
    lat: 25.1972,
    lng: 55.2744,
    types: ["Apartment", "Penthouse"],
  },
  {
    slug: "dubai-marina",
    name: "Dubai Marina",
    dld: "Marsa Dubai",
    basePpsf: 1580,
    drift: 0.09,
    rentYield: 0.068,
    lat: 25.0805,
    lng: 55.1403,
    types: ["Apartment"],
  },
  {
    slug: "business-bay",
    name: "Business Bay",
    dld: "Business Bay",
    basePpsf: 1490,
    drift: 0.1,
    rentYield: 0.071,
    lat: 25.1857,
    lng: 55.2766,
    types: ["Apartment", "Office"],
  },
  {
    slug: "dubai-hills-estate",
    name: "Dubai Hills Estate",
    dld: "Hadaeq Sheikh Mohammed Bin Rashid",
    basePpsf: 1610,
    drift: 0.12,
    rentYield: 0.058,
    lat: 25.1042,
    lng: 55.2469,
    types: ["Villa", "Townhouse", "Apartment"],
  },
  {
    slug: "jumeirah-village-circle",
    name: "Jumeirah Village Circle",
    dld: "Al Barsha South Fourth",
    basePpsf: 980,
    drift: 0.08,
    rentYield: 0.079,
    lat: 25.0592,
    lng: 55.2088,
    types: ["Apartment", "Townhouse"],
  },
];

/** Typical internal areas in square metres, by unit type. */
const SIZES = {
  Apartment: { mean: 105, deviation: 40, min: 38 },
  Penthouse: { mean: 320, deviation: 110, min: 160 },
  Villa: { mean: 420, deviation: 160, min: 180 },
  Townhouse: { mean: 220, deviation: 60, min: 120 },
  Office: { mean: 140, deviation: 70, min: 45 },
};

const MONTHS = 36;
const escape = (value) => String(value).replace(/'/g, "''");

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** Bedrooms that make sense for the size, in DLD's own vocabulary. */
function bedroomsFor(type, sqm) {
  if (type === "Office") return { rooms: "Office", beds: null };
  if (sqm < 50) return { rooms: "Studio", beds: 0 };
  const beds = Math.max(1, Math.min(7, Math.round(sqm / 75)));
  return { rooms: `${beds} B/R`, beds };
}

const lines = [];
lines.push(`-- GENERATED FILE — do not edit by hand.`);
lines.push(
  `-- Regenerate: node scripts/generate-market-sample.mjs > supabase/seed/market-sample.sql`,
);
lines.push(`--`);
lines.push(`-- Illustrative market data for development and demos. Written with`);
lines.push(`-- provenance = 'sample', which is what makes the site describe these figures`);
lines.push(`-- as illustrative rather than citing the Dubai Land Department. Loading real`);
lines.push(`-- DLD records supersedes every row here automatically.`);
lines.push("");
lines.push("begin;");
lines.push("");
lines.push("-- Communities. Existing rows keep their content; only the DLD mapping is set.");

for (const area of AREAS) {
  lines.push(
    `insert into public.areas (slug, name, dld_area_name, latitude, longitude, is_published, published_at)\n` +
      `values ('${area.slug}', '${escape(area.name)}', '${escape(area.dld)}', ${area.lat}, ${area.lng}, true, now())\n` +
      `on conflict (slug) do update set dld_area_name = excluded.dld_area_name,\n` +
      `  latitude = coalesce(public.areas.latitude, excluded.latitude),\n` +
      `  longitude = coalesce(public.areas.longitude, excluded.longitude);`,
  );
}

lines.push("");
lines.push("-- Clear any previous sample run, so this file is idempotent.");
lines.push("delete from public.dld_transactions where provenance = 'sample';");
lines.push("delete from public.dld_rent_contracts where provenance = 'sample';");
lines.push("");

const now = new Date();
let transactionRows = [];
let rentRows = [];
let sequence = 0;

for (const area of AREAS) {
  for (let monthsAgo = MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
    const yearsElapsed = (MONTHS - 1 - monthsAgo) / 12;

    /* Trend, plus a seasonal dip over the summer, plus month-to-month noise. */
    const trend = Math.pow(1 + area.drift, yearsElapsed);
    const seasonal = 1 + 0.02 * Math.sin((month.getUTCMonth() / 12) * 2 * Math.PI);
    const noise = 1 + (random() - 0.5) * 0.05;
    const ppsf = area.basePpsf * trend * seasonal * noise;

    /* Volume grows gently with the market and varies month to month. */
    const volume = Math.max(3, Math.round(normal(14 + yearsElapsed * 4, 4)));

    for (let i = 0; i < volume; i++) {
      const type = pick(area.types);
      const size = SIZES[type];
      const sqm = Math.max(size.min, Math.round(normal(size.mean, size.deviation)));
      const unitPpsf = Math.max(300, ppsf * (1 + (random() - 0.5) * 0.22));
      const sqft = sqm * 10.7639104;
      const amount = Math.round((unitPpsf * sqft) / 1000) * 1000;
      const day = 1 + Math.floor(random() * 27);
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
      const { rooms, beds } = bedroomsFor(type, sqm);
      const offPlan = random() < 0.34;

      sequence += 1;
      transactionRows.push(
        `('sample', 'SAMPLE-${String(sequence).padStart(7, "0")}', '${isoDate(date)}', 'Sales', ` +
          `'${offPlan ? "Off-Plan" : "Ready"}', '${type}', '${escape(area.dld)}', ` +
          `${beds === null ? "null" : `'${rooms}'`}, ${beds === null ? "null" : beds}, ` +
          `${amount}, ${sqm}, ${random() < 0.85}, ${area.lat}, ${area.lng})`,
      );
    }

    /* Tenancy contracts, generated to imply the community's gross yield. */
    const rentCount = Math.max(2, Math.round(volume * 0.6));
    for (let i = 0; i < rentCount; i++) {
      const type = pick(area.types);
      const size = SIZES[type];
      const sqm = Math.max(size.min, Math.round(normal(size.mean, size.deviation)));
      const saleValue = ppsf * sqm * 10.7639104;
      const annualRent =
        Math.round((saleValue * area.rentYield * (1 + (random() - 0.5) * 0.18)) / 1000) * 1000;
      const day = 1 + Math.floor(random() * 27);
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
      const { beds } = bedroomsFor(type, sqm);

      sequence += 1;
      rentRows.push(
        `('sample', 'SAMPLE-RENT-${String(sequence).padStart(7, "0")}', '${isoDate(date)}', ` +
          `'${escape(area.dld)}', '${type}', ${beds === null ? "null" : beds}, ${annualRent}, ${sqm})`,
      );
    }
  }
}

/** Chunked, because a single statement with 20,000 tuples is unkind to parsers. */
function emitInsert(table, columns, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    lines.push(`insert into public.${table} (${columns}) values`);
    lines.push(chunk.join(",\n") + ";");
    lines.push("");
  }
}

emitInsert(
  "dld_transactions",
  "provenance, source_transaction_id, transaction_date, transaction_group, registration_type, " +
    "property_type, area_name_raw, rooms_raw, bedrooms, amount, area_sqm, is_freehold, latitude, longitude",
  transactionRows,
);

emitInsert(
  "dld_rent_contracts",
  "provenance, source_contract_id, contract_start_date, area_name_raw, property_type, bedrooms, annual_rent, area_sqm",
  rentRows,
);

lines.push("-- Resolve DLD's community names to our own area rows, then derive the metrics.");
lines.push("select public.link_transactions_to_areas();");
lines.push("select public.refresh_area_stats();");
lines.push("");
lines.push("commit;");

process.stdout.write(lines.join("\n") + "\n");
process.stderr.write(
  `Generated ${transactionRows.length} transactions and ${rentRows.length} rent contracts across ${AREAS.length} communities.\n`,
);
