#!/usr/bin/env node
/**
 * The go-live check.
 *
 * Seven phases of work reach production through a set of environment variables,
 * and every one of them fails quietly when it is missing: no pixel fires, no
 * email sends, the advisor answers with its fallback line, the nurture sequence
 * never runs. None of that throws. The site looks fine and simply does not work,
 * which is the worst failure mode there is because nobody notices for a week.
 *
 * So this script says, in one place, what is configured and what is not, and
 * what each missing thing actually costs. It is deliberately opinionated about
 * severity:
 *
 *   REQUIRED     the site is broken or dishonest without it
 *   RECOMMENDED  a feature silently does nothing
 *   OPTIONAL     a deliberate choice, listed so it is a choice
 *
 * It exits non-zero only on REQUIRED, so it can gate a deploy without blocking
 * one that has consciously left the ad tags off.
 *
 *   node scripts/preflight.mjs
 *   node scripts/preflight.mjs --url https://dlxproperties.ae   (also smoke-tests)
 */
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const SMOKE_URL = urlIndex !== -1 ? args[urlIndex + 1] : null;

/**
 * Every variable the codebase reads, what it is for, and what breaks without it.
 *
 * Kept in one list rather than scattered through the modules that read them,
 * because the question this answers — "is this deployment complete?" — cannot be
 * answered by any single module.
 */
const VARIABLES = [
  // --- The site itself ----------------------------------------------------
  {
    name: "VITE_SITE_URL",
    level: "required",
    what: "The canonical origin.",
    cost: "Canonical tags, hreflang, the sitemap and every OG image URL point at the wrong host.",
  },
  {
    name: "VITE_SUPABASE_URL",
    level: "required",
    what: "The Supabase project.",
    cost: "No listings, no market data, no leads. Every data-driven page renders empty.",
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    level: "required",
    what: "The browser's Supabase key.",
    cost: "As above — the client cannot read anything.",
    aliases: ["VITE_SUPABASE_ANON_KEY"],
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    level: "required",
    what: "Server-side Supabase access.",
    cost: "Lead writes, routing and the admin all fail.",
  },

  // --- Leads reaching a person -------------------------------------------
  {
    name: "RESEND_API_KEY",
    level: "required",
    what: "Transactional email.",
    cost: "A lead arrives in the database and nobody is told. No admin alert, no client confirmation.",
  },
  {
    /*
     * The name the Edge Function actually reads.
     *
     * This check named LEAD_NOTIFICATION_EMAIL until it was cross-referenced
     * against supabase/functions/send-lead-emails/index.ts, which reads
     * LEAD_ADMIN_EMAIL. Anyone following the preflight would have set a
     * variable nothing reads, the check would have gone green, and every admin
     * notification would have quietly gone to the fallback address instead —
     * precisely the silent failure this script exists to catch.
     */
    name: "LEAD_ADMIN_EMAIL",
    level: "required",
    what: "Where admin notifications land (comma-separated for several).",
    cost: "Notifications fall back to hello@ rather than reaching the desk that works the leads.",
  },
  {
    name: "LEAD_FROM_EMAIL",
    level: "recommended",
    what: 'The verified Resend sender, e.g. "DLX Properties <hello@dlxproperties.ae>".',
    cost: "Both emails send from a default address that may not be verified with Resend, so they land in spam or bounce.",
  },

  // --- The advisor --------------------------------------------------------
  {
    name: "LOVABLE_API_KEY",
    level: "recommended",
    what: "The AI advisor's model.",
    cost: "The advisor answers with its fallback line and captures no conversations.",
  },
  {
    name: "FISH_AUDIO_API_KEY",
    level: "optional",
    what: "Voice for the advisor.",
    cost: "The 'prefer to talk' path is hidden. Chat is unaffected.",
  },
  {
    name: "VOICE_WEBHOOK_SECRET",
    level: "optional",
    what: "Signs call-summary webhooks.",
    cost: "Call summaries cannot be posted back to the admin. Required if voice is on.",
  },

  // --- Paid media ---------------------------------------------------------
  {
    name: "VITE_META_PIXEL_ID",
    level: "recommended",
    what: "The Meta pixel.",
    cost: "No browser-side conversions. Meta optimises blind.",
  },
  {
    name: "META_CAPI_TOKEN",
    level: "recommended",
    what: "Meta's Conversions API.",
    cost: "No server-side copy, so conversions lost to ad blockers are lost for good.",
  },
  {
    name: "VITE_GA4_MEASUREMENT_ID",
    level: "recommended",
    what: "GA4.",
    cost: "No analytics at all.",
  },
  {
    name: "VITE_GOOGLE_ADS_ID",
    level: "recommended",
    what: "The Google Ads tag.",
    cost: "Google Ads cannot attribute a conversion to a click.",
  },
  {
    name: "VITE_TURNSTILE_SITE_KEY",
    level: "recommended",
    what: "Cloudflare Turnstile.",
    cost: "Forms fall back to the honeypot and validation alone. Workable, noisier.",
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    level: "recommended",
    what: "Turnstile verification.",
    cost: "Tokens are accepted without being checked, which is the same as no Turnstile.",
  },
  {
    name: "META_APP_SECRET",
    level: "optional",
    what: "Verifies Meta Instant Form webhooks.",
    cost: "Native Meta lead forms cannot be ingested. Required only if they are used.",
  },
  {
    name: "GOOGLE_LEAD_FORM_KEY",
    level: "optional",
    what: "Verifies Google Lead Form posts.",
    cost: "Native Google lead forms are refused. Required only if they are used.",
  },
  {
    name: "NURTURE_SECRET",
    level: "optional",
    what: "Authorises the nurture Edge Function.",
    cost: "The warm/cold sequence cannot run.",
  },

  // --- Data and money -----------------------------------------------------
  {
    name: "DUBAI_PULSE_CLIENT_ID",
    level: "recommended",
    what: "Dubai Pulse (DLD open data).",
    cost: "The market pages keep showing sample figures labelled as sample. Honest, but it is the whole differentiator switched off.",
  },
  {
    name: "ERROR_WEBHOOK_URL",
    level: "recommended",
    what: "Where production errors are posted.",
    cost: "Server errors reach the process log and nowhere else. On a self-hosted deploy that means nobody finds out — see src/data/monitoring.server.ts.",
  },
  {
    name: "GOOGLE_ADS_CONVERSION_URL",
    level: "optional",
    what: "The relay that forwards offline conversions to Google Ads.",
    cost: "A qualified or won lead is never reported back, so Google Ads keeps optimising for form fills rather than deals.",
  },
  {
    name: "DUBAI_PULSE_CLIENT_SECRET",
    level: "recommended",
    what: "The other half of the Dubai Pulse credential.",
    cost: "The DLD sync cannot authenticate, so the market pages stay on sample data.",
  },
  {
    name: "FX_RATES_URL",
    level: "recommended",
    what: "Live exchange rates.",
    cost: "Prices show in dirhams and US dollars only — the dollar peg is the one rate we hold without a feed.",
  },
];

/** The launch steps no environment variable can tell you about. */
const MANUAL_STEPS = [
  "Apply every migration in supabase/migrations to the production project.",
  "Deploy the Edge Functions: send-lead-emails, sync-dld-data, advisor-call-summary, lead-nurture.",
  "Import a real Dubai Pulse export — this is what turns every 'illustrative sample data' line into a DLD citation.",
  "Import verified reviews with a source and a source_url. The review block renders nothing until then, by design.",
  "Replace the placeholder brand facts in src/config/brand.ts: the phone number is +971 (0) 000 0000.",
  "Build the six retargeting audiences listed in /admin/roas.",
  "Have /privacy reviewed by a lawyer. It describes what the code does; it is not yet a legal notice.",
  "Submit https://<origin>/sitemap.xml to Google Search Console and Bing Webmaster Tools.",
];

const missing = { required: [], recommended: [], optional: [] };

function isSet(variable) {
  const names = [variable.name, ...(variable.aliases ?? [])];
  return names.some((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/**
 * A handful of requests that prove the deployment is actually serving.
 *
 * Not a test suite — the assertion suites cover behaviour. This answers the
 * narrower question you ask at 2am after a deploy: is it up, is it the right
 * build, and do the three routes that earn money respond.
 */
async function smokeTest(origin) {
  const base = origin.replace(/\/+$/, "");
  const checks = [
    { path: "/", expect: 200, contains: "DLX" },
    { path: "/ar", expect: 200, contains: 'dir="rtl"' },
    { path: "/properties", expect: 200 },
    { path: "/contact", expect: 200 },
    { path: "/sitemap.xml", expect: 200, contains: "<urlset" },
    /*
     * robots.txt deliberately serves a blanket Disallow on any origin that is
     * not the canonical one, so a staging deploy cannot be indexed. Asserting
     * the Sitemap line only against the real host is therefore the correct
     * check, not a weaker one — on staging its *absence* is the pass.
     */
    {
      path: "/robots.txt",
      expect: 200,
      contains: /^https:\/\/(?!localhost|127\.)/i.test(base) ? "Sitemap:" : "User-agent:",
    },
    { path: "/this-page-does-not-exist", expect: 404 },
  ];

  console.log(`\nSmoke-testing ${base}\n`);
  let failed = 0;

  for (const check of checks) {
    try {
      const response = await fetch(`${base}${check.path}`, { redirect: "manual" });
      const body = check.contains ? await response.text() : "";
      const statusOk = response.status === check.expect;
      const bodyOk = !check.contains || body.includes(check.contains);

      if (statusOk && bodyOk) {
        console.log(`  ✓ ${check.path.padEnd(28)} ${response.status}`);
      } else {
        failed += 1;
        const why = !statusOk
          ? `expected ${check.expect}, got ${response.status}`
          : `missing "${check.contains}"`;
        console.log(`  ✗ ${check.path.padEnd(28)} ${why}`);
      }
    } catch (error) {
      failed += 1;
      console.log(`  ✗ ${check.path.padEnd(28)} ${String(error)}`);
    }
  }

  return failed;
}

async function main() {
  console.log("DLX Properties — launch preflight\n");

  /* A .env file is loaded by Vite at build time, not by Node here. Read it so
   * the check reflects what the build will actually see. */
  try {
    const env = await readFile(".env", "utf8");
    for (const line of env.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match?.[1] && process.env[match[1]] === undefined) {
        process.env[match[1]] = (match[2] ?? "").replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    console.log("  (no .env file — reading the process environment only)\n");
  }

  for (const variable of VARIABLES) {
    if (!isSet(variable)) missing[variable.level].push(variable);
  }

  const configured = VARIABLES.length - Object.values(missing).flat().length;
  console.log(`  ${configured} of ${VARIABLES.length} variables configured\n`);

  for (const [level, heading] of [
    ["required", "REQUIRED — the site is broken without these"],
    ["recommended", "RECOMMENDED — these features silently do nothing"],
    ["optional", "OPTIONAL — listed so that leaving them out is a decision"],
  ]) {
    const entries = missing[level];
    if (entries.length === 0) continue;
    console.log(`${heading}\n`);
    for (const variable of entries) {
      console.log(`  ${variable.name}`);
      console.log(`      ${variable.what} ${variable.cost}`);
    }
    console.log("");
  }

  console.log("MANUAL STEPS — nothing here can be checked from an environment variable\n");
  for (const step of MANUAL_STEPS) console.log(`  □ ${step}`);

  let smokeFailures = 0;
  if (SMOKE_URL) smokeFailures = await smokeTest(SMOKE_URL);

  console.log("");
  if (missing.required.length > 0) {
    console.log(`✗ ${missing.required.length} required variable(s) missing — do not deploy.`);
    process.exit(1);
  }
  if (smokeFailures > 0) {
    console.log(`✗ ${smokeFailures} smoke check(s) failed.`);
    process.exit(1);
  }
  console.log("✓ Every required variable is set.");
  if (missing.recommended.length > 0) {
    console.log(
      `  ${missing.recommended.length} recommended one(s) are not — see above for what that costs.`,
    );
  }
}

await main();
