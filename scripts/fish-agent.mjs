#!/usr/bin/env node
/**
 * Provisions the Fish Audio voice agent from what this site already publishes.
 *
 * Fish Audio's Agents platform holds a prompt, a knowledge base, structured
 * post-call extraction and a webhook. All four of those already exist in this
 * repo in some form, and the whole point of this script is that they are not
 * retyped into a console: the agent is built from `/advisor-knowledge.json`,
 * which is the same index the chat advisor answers from and which carries the
 * published DLD figures. CLAUDE.md asks for one brain across chat and voice.
 * A prompt maintained in a web form is a second brain with a slower clock.
 *
 * Run it after every data export. It is idempotent: sources are matched by
 * title and updated in place rather than duplicated.
 *
 *   node scripts/fish-agent.mjs                 # build the draft, change nothing live
 *   node scripts/fish-agent.mjs --publish       # and make it the live version
 *   node scripts/fish-agent.mjs --voices        # just list candidate voices
 *
 * Environment:
 *   FISH_API or FISH_AUDIO_API_KEY   required
 *   FISH_AGENT_ID                    set after the first run, to update in place
 *   FISH_VOICE_ID                    optional; otherwise one is chosen and printed
 *   FISH_WEBHOOK_SECRET              optional; signs the post-call webhook
 *   SITE_ORIGIN                      defaults to https://dlxproperties.com
 *
 * NOTHING GOES LIVE WITHOUT --publish. Fish runs the latest *published*
 * version for real sessions, so a run without the flag leaves the draft
 * updated and every caller still hearing the version you last approved.
 */

const API = "https://api.fish.audio";
const KEY = process.env["FISH_API"] ?? process.env["FISH_AUDIO_API_KEY"];
const ORIGIN = (process.env["SITE_ORIGIN"] ?? "https://dlxproperties.com").replace(/\/+$/, "");
const AGENT_ID = process.env["FISH_AGENT_ID"] ?? null;
const PUBLISH = process.argv.includes("--publish");
const VOICES_ONLY = process.argv.includes("--voices");

if (!KEY) {
  console.error("FISH_API is not set. Export the key from Lovable and run again.");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${KEY}` };

async function api(path, { method = "GET", json, body, headers = {} } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...auth,
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
    ...(body ? { body } : {}),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} responded ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

/**
 * Picks the voice, rather than hard-coding an id nobody can verify.
 *
 * A 32-character model id pasted into a script is unverifiable until it runs,
 * and a wrong one fails at the worst moment. So the library is queried with
 * your own key and the choice is printed, which also means the shortlist stays
 * current as Fish's catalogue changes.
 *
 * Ranked on Fish's own score, filtered to English voices that the catalogue
 * tags female. `expressive` is set on the agent separately: that is the
 * setting that lets the voice carry emotion, and it is independent of which
 * voice you pick.
 */
async function pickVoice() {
  const query = new URLSearchParams({
    page_size: "100",
    page_number: "1",
    language: "en",
    sort_by: "score",
  });
  const { items = [] } = await api(`/model?${query}`);

  const female = items.filter((model) => {
    if (model.type && model.type !== "tts") return false;
    if (model.state && model.state !== "trained") return false;
    const tags = (model.tags ?? []).map((tag) => String(tag).toLowerCase());
    const title = String(model.title ?? "").toLowerCase();
    return tags.includes("female") || tags.includes("woman") || /\b(female|woman)\b/.test(title);
  });

  const ranked = (female.length > 0 ? female : items).sort(
    (a, b) => (b.task_count ?? 0) - (a.task_count ?? 0) || (b.like_count ?? 0) - (a.like_count ?? 0),
  );

  return { ranked, chosen: ranked[0] ?? null };
}

/**
 * The knowledge, as documents.
 *
 * One file per entry, not one file for everything. Fish searches a corpus over
 * 8 KB on every turn using the caller's own sentence as the query, so a
 * question about one community should retrieve that community rather than a
 * slab containing all of them. Each document opens with the questions people
 * actually ask, because those are what the caller's sentence is matched
 * against. That is the honest version of a keyword list.
 */
function renderEntry(entry) {
  const lines = [`# ${entry.title}`, ""];
  if (entry.questions?.length) {
    lines.push("Answers questions like:", ...entry.questions.map((q) => `- ${q}`), "");
  }
  if (entry.answer) lines.push(entry.answer, "");
  if (entry.body?.length) lines.push(...entry.body.map((line) => `- ${line}`), "");
  if (entry.source) lines.push(`Source: ${entry.source}`, "");
  if (entry.url) lines.push(`Read it on the site: ${ORIGIN}${entry.url}`, "");
  if (entry.requiresVerification) {
    lines.push("Say that these figures should be confirmed with the relevant authority.", "");
  }
  if (entry.routeToHuman) {
    lines.push("Do not advise on this. State what is published and hand the caller to a named consultant.", "");
  }
  return lines.join("\n");
}

function systemPrompt(policy) {
  const list = (label, items) =>
    items?.length ? [`${label}:`, ...items.map((line) => `- ${line}`), ""] : [];

  return [
    "You are Noor, the voice advisor for DLX Properties, a licensed Dubai real estate brokerage (RERA ORN 40905).",
    "",
    "You are on a phone call. Keep every turn to two or three sentences. Never read a list aloud; give the one figure that answers the question and offer the rest.",
    "",
    ...list("You may talk about", policy?.scope),
    ...list("You must never", policy?.never),
    ...list("Hand these to a named human consultant", policy?.escalate),
    "How to talk about figures:",
    "- Every figure you have comes from Dubai Land Department open data, and you say so.",
    "- These are records of what was registered. They are not a valuation and not a forecast.",
    "- DLX does not set prices. Developers and owners set prices. We publish the record so a buyer can check what they are told.",
    "- If you do not have a figure, say you do not have it and offer a consultant. Never estimate one.",
    "",
    "If someone wants to speak to a person, or asks anything about visas, tax or law that turns on their own circumstances, stop and offer to have a consultant call them back. Take their name and number.",
  ].join("\n");
}

/** What to pull out of a finished call. These mirror the site's own lead fields. */
const DATA_FIELDS = [
  { name: "caller_name", type: "text", description: "The caller's name, if they give it." },
  /* These two vocabularies are the site's own, not invented for Fish. The
   * webhook maps them straight through and drops anything outside them, so a
   * value added here without adding it there would be silently discarded. */
  { name: "intent", type: "enum", description: "What the caller wants to do.",
    enum_options: ["buy", "sell", "rent", "invest", "relocate", "advice"] },
  { name: "budget_aed", type: "number", description: "The caller's budget in AED as a plain number, only if they stated one clearly. Otherwise leave it empty." },
  { name: "timeline", type: "enum", description: "How soon the caller wants to act.",
    enum_options: ["immediately", "within_3_months", "within_12_months", "researching"] },
  { name: "communities", type: "text", description: "Any Dubai communities or projects the caller named." },
  { name: "callback_requested", type: "boolean", description: "True if the caller asked for a person to call them back." },
  { name: "callback_number", type: "text", description: "A phone number the caller gave for a callback." },
];

async function main() {
  if (VOICES_ONLY) {
    const { ranked } = await pickVoice();
    console.log(`${ranked.length} candidate English voices, best first:\n`);
    for (const voice of ranked.slice(0, 15)) {
      console.log(`  ${voice._id}  ${String(voice.title).slice(0, 44).padEnd(46)} ${(voice.tags ?? []).slice(0, 4).join(", ")}`);
    }
    console.log("\nSet the one you want as FISH_VOICE_ID.");
    return;
  }

  console.log(`Reading the published knowledge from ${ORIGIN}/advisor-knowledge.json`);
  const index = await fetch(`${ORIGIN}/advisor-knowledge.json`).then((r) => {
    if (!r.ok) throw new Error(`knowledge endpoint responded ${r.status}`);
    return r.json();
  });
  const entries = index.entries ?? [];
  console.log(`  ${entries.length} entries, assembled ${index.generatedAt}`);

  let voiceId = process.env["FISH_VOICE_ID"] ?? null;
  if (!voiceId) {
    const { chosen } = await pickVoice();
    if (!chosen) throw new Error("No voice could be chosen. Run with --voices and set FISH_VOICE_ID.");
    voiceId = chosen._id;
    console.log(`  voice chosen: ${chosen.title} (${voiceId})`);
    console.log("  set FISH_VOICE_ID to pin it, or run --voices to see the alternatives");
  }

  const config = {
    prompt: {
      system_prompt: systemPrompt(index.policy),
      first_message:
        "DLX Properties, this is Noor. I can talk you through prices and rents in any Dubai community, or put you through to a consultant. What are you looking at?",
    },
    voice: {
      voice_id: voiceId,
      speaking_language: "en",
      /* Slightly under natural pace. This advisor reads numbers aloud, and a
       * mishead figure is the one failure that costs somebody money. */
      speed: 0.95,
      /* The emotion setting: lets the voice add its own emphasis, pauses and
       * contractions. The cues are never spoken and never reach a transcript. */
      expressive: true,
    },
    analysis: { data_fields: DATA_FIELDS },
    ...(process.env["FISH_WEBHOOK_SECRET"]
      ? {
          webhooks: {
            post_call: [
              { url: `${ORIGIN}/api/advisor/fish-webhook`, secret: process.env["FISH_WEBHOOK_SECRET"] },
            ],
          },
        }
      : {}),
  };

  let agentId = AGENT_ID;
  if (agentId) {
    console.log(`Updating agent ${agentId}`);
    await api(`/v1/agent/agents/${agentId}/config`, { method: "PATCH", json: config });
  } else {
    console.log("Creating the agent");
    const created = await api("/v1/agent/agents", {
      method: "POST",
      json: { name: "Noor, DLX Properties", config },
    });
    agentId = created.agent_id ?? created._id ?? created.id;
    console.log(`  created ${agentId}`);
    console.log(`  set FISH_AGENT_ID=${agentId} so the next run updates it instead of making another`);
  }

  /* Sources are matched by title so a re-run replaces rather than duplicates.
   * Fish allows 100 per agent; the index is trimmed to fit, keeping the
   * market entries, which are the ones that change and the ones nobody else
   * can answer. */
  const existing = await api("/v1/agent/knowledge-sources").catch(() => ({ items: [] }));
  const byTitle = new Map((existing.items ?? existing.data ?? []).map((s) => [s.title, s._id ?? s.id]));

  const ordered = [...entries].sort(
    (a, b) => (a.kind === "market" ? -1 : 0) - (b.kind === "market" ? -1 : 0),
  );
  const sourceIds = [];
  for (const entry of ordered.slice(0, 100)) {
    const title = `${entry.kind}: ${entry.title}`.slice(0, 120);
    const markdown = renderEntry(entry);
    const form = new FormData();
    form.append("title", title);
    form.append("file", new Blob([markdown], { type: "text/markdown" }), `${entry.id.replace(/[^\w.-]+/g, "-")}.md`);

    const held = byTitle.get(title);
    const saved = held
      ? await api(`/v1/agent/knowledge-sources/${held}`, { method: "PATCH", body: form })
      : await api("/v1/agent/knowledge-sources", { method: "POST", body: form });
    sourceIds.push(saved?._id ?? saved?.id ?? held);
  }
  console.log(`  ${sourceIds.length} knowledge sources uploaded`);

  await api(`/v1/agent/agents/${agentId}/config`, {
    method: "PATCH",
    json: { knowledge_source_ids: sourceIds.filter(Boolean) },
  });

  if (PUBLISH) {
    const version = await api(`/v1/agent/agents/${agentId}/publish`, { method: "POST" });
    console.log(`Published version ${version?.version_number ?? "(new)"}. This is now what callers hear.`);
  } else {
    console.log("\nDraft updated. Nothing a caller hears has changed.");
    console.log("Test it in the Fish console, then re-run with --publish.");
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
