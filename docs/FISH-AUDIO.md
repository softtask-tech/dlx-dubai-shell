# Fish Audio — the advisor's voice

> **Scope of this document, and what it does not yet cover.**
>
> Everything below describes the **text-to-speech** integration, which is
> built and working: our own advisor decides what to say and Fish Audio reads
> it aloud.
>
> Fish Audio also sells a **Voice Agents** platform, which is a different
> product and is **not built**. There the agent itself holds the prompt, a
> knowledge base, its own LLM and post-call analysis, and it runs the
> conversation rather than just voicing ours. That is the one worth having,
> and section 9 is the plan for it.

Everything about how Noor speaks: what to set, how to change the voice, how our
own market data reaches the answer that gets spoken, and how a phone call turns
into a lead in Supabase.

Nothing here is aspirational. Every file named exists in this repo, and the
"check it worked" step under each part is one you can actually run.

---

## 1. What Fish Audio does here, and what it does not

Fish Audio is **text to speech only**. It takes a finished sentence and returns
audio. It does not think, does not know anything about Dubai, and never decides
what to say.

The split matters, because it is the thing people get wrong when they read
"voice AI":

| Job | Who does it |
| --- | --- |
| Answering the phone, transcribing the caller | Your telephony provider |
| Deciding what to say | `src/data/advisor.server.ts` (same brain as the chat) |
| Knowing our DLD figures | `src/data/knowledge-dld.server.ts` → the market RPCs |
| Turning the answer into audio | **Fish Audio** |
| Turning the finished call into a lead | `advisor-call-summary` → `/api/advisor/call-lead` |

There is deliberately **one brain** for chat and phone. `prepareTurn` builds the
same messages from the same system prompt for both, with `channel: "voice"`
changing only the delivery. A second set of rules for the phone is a set that
drifts, and the guardrails (never invent a price, cite DLD, route specifics to a
human) are the part that must not drift.

---

## 2. Environment variables

Set these in Lovable under project settings, not in a file.

| Variable | Required | What it does |
| --- | --- | --- |
| `FISH_API` *or* `FISH_AUDIO_API_KEY` | **yes** | Your API key. The code reads either name, `FISH_AUDIO_API_KEY` first. Yours is currently saved as `FISH_API`, which works. |
| `FISH_AUDIO_MODEL` | usually | The TTS engine: `s1`, `s2-pro`, `s2.1-pro`, `s2.1-pro-free`. **See the warning below.** |
| `FISH_AUDIO_VOICE_ID` | no | Which voice. Unset uses the API default voice. |
| `FISH_AUDIO_LATENCY` | no | `low` \| `balanced` \| `normal`. Defaults to `balanced` here. |
| `FISH_AUDIO_API_URL` | no | Override the endpoint for a region or self-hosted server. |
| `VOICE_WEBHOOK_SECRET` | **yes, for calls** | Shared secret on `/api/advisor/voice`. Without it that route refuses every call, by design. |

### The one that bites: `FISH_AUDIO_MODEL`

Fish Audio bills per model. **The free developer tier only serves
`s2.1-pro-free`.** If you send no model header, the API defaults to the paid
`s2.1-pro` — so a perfectly valid free-tier key comes back **402 Payment
Required** and no audio plays, which looks exactly like a broken key.

We deliberately do not default this. Guessing would either downgrade a paying
account's voice or silently fail a free one.

- On the **free tier** → set `FISH_AUDIO_MODEL=s2.1-pro-free`
- On a **paid plan** → leave it unset, or set `s2.1-pro` explicitly

If it is wrong, `src/data/voice.server.ts` logs the reason in words, not just a
status code:

```
[advisor:voice] Fish Audio responded 402: payment required — on the free
developer tier set FISH_AUDIO_MODEL=s2.1-pro-free, otherwise check billing
```

---

## 3. Choosing the voice

1. Go to <https://fish.audio> and open any voice in the library, or clone your
   own under **Manage Voices**.
2. The model id is in the page URL, and there is a copy button beside the voice.
3. Set it as `FISH_AUDIO_VOICE_ID`.

That id is passed straight through as `reference_id` on the TTS request.

**Picking one for DLX.** The advisor speaks to five audiences (US/Western,
European, GCC, Indian/Pakistani, relocating families) and reads figures aloud.
Prefer a clear, unhurried voice over a characterful one: numbers are the thing
people mishear, and an expressive read makes "one thousand six hundred and
eighty-eight" harder, not easier. If you clone a voice, record the reference
audio reading numbers, not prose.

### Verify the voice changed

```bash
curl -s -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_API" \
  -H "Content-Type: application/json" \
  -H "model: s2.1-pro-free" \
  -d '{"text":"The median price in Dubai Marina was four thousand and thirty seven dirhams a square foot.","format":"mp3","reference_id":"YOUR_VOICE_ID"}' \
  --output voice-test.mp3
```

A non-trivial `voice-test.mp3` means the key, the model and the voice id are all
good. An HTML or JSON body instead of audio means one of the three is wrong —
open the file in a text editor and read the message.

---

## 4. The exact request we send

`src/data/voice.server.ts`, function `synthesize`:

```
POST https://api.fish.audio/v1/tts
Authorization: Bearer <FISH_API>
Content-Type: application/json
model: <FISH_AUDIO_MODEL>        // only when set

{
  "text":         "<capped at 1200 characters>",
  "format":       "mp3",
  "mp3_bitrate":  64,
  "latency":      "balanced",
  "reference_id": "<FISH_AUDIO_VOICE_ID>"   // only when set
}
```

Three decisions worth knowing:

- **1,200-character cap.** Synthesis is billed per character. The prompt already
  tells the advisor to keep voice turns to two or three sentences; this is the
  backstop for when it does not, and it stops one runaway reply becoming a bill
  and two minutes of monologue at a caller.
- **64 kbps mono MP3.** Telephony downsamples anyway, and a smaller payload is a
  shorter silence before the caller hears anything.
- **Returns `null`, never throws.** A missing or failed voice costs the audio,
  not the answer — the panel shows text and the phone line falls back to the
  provider's own speech.

---

## 5. How our data reaches what gets spoken

This is the part that makes the advisor worth having, and it happens **before**
Fish Audio is involved.

```
caller speaks
   → telephony transcribes
   → POST /api/advisor/voice          (src/routes/api/advisor/voice.ts)
      → prepareTurn()                 (src/data/advisor.server.ts)
         → retrieveContext()          (src/data/knowledge.server.ts)
            → buildKnowledgeIndex()   (src/data/knowledge.ts)
               → buildDldKnowledge()  (src/data/knowledge-dld.server.ts)
                  → the same bounded RPCs the market pages call
      → complete()                    → the answer, in words
   → synthesize()                     → Fish Audio → audio
   → telephony plays it
```

The advisor reads the **same published aggregates the website does** — the
bounded public RPCs in `src/data/market-public.server.ts`. It cannot reach a
project, a building or an individual contract, because those functions cannot,
and the scope registry gates every one of them. So the advisor is structurally
incapable of quoting a figure the site would not publish.

This was not true until recently and the failure was worth recording. The
advisor's market knowledge came from `areas.stats`, an older table whose
provenance column marks some rows `sample`, while the pages published a
separate set of figures from `dld_market_aggregates`. A page could say a
community costs AED 1,379 a square foot and the advisor, asked the same
question in the same minute, could answer from a different number — or from an
illustrative one. Rows that are not `dld_open_data` are now dropped from the
index outright rather than carried with a disclaimer, because a disclaimer is
only as good as the model's willingness to repeat it.

Each community entry is marked `routeToHuman`. The advisor may state every
published figure; whether a community suits a particular buyer is a
consultant's answer, and the gap between those two is where somebody loses
money.

### Feeding it new data

You do not feed the advisor separately. Publish a metric and the advisor has it:

1. Build the figures — `scripts/build-dld-aggregates.py`.
2. Load them into `dld_market_aggregates` and flip the publication run.
3. Open the metric to a level in `dld_market_scope_registry`.

Step 3 is the switch. The index caches for fifteen minutes
(`src/data/knowledge.server.ts`), so allow that long before a newly published
metric starts coming out of the advisor's mouth. A metric that is not in the scope registry is invisible to
both the site and the advisor, which is the intended failsafe: there is no way
to make the advisor say a number the public surface would refuse to.

### Guardrails, in `src/config/advisor.ts`

Scope is Dubai/UAE property, investment, Golden Visa and relocation. Anything
else is declined politely. It must never invent prices, availability, or legal,
visa or tax specifics, must cite the Dubai Land Department with the freshness
date, and must route specifics to a human consultant. On the phone these matter
more, not less: a caller cannot re-read a sentence, so the reply is **not
streamed** — "the threshold is two million" and "the threshold is two million,
but confirm it, because it changes" are different statements and only one of
them is allowed to be heard.

---

## 6. Turning a call into a lead

Already built, end to end. Fish Audio plays no part in it — leads come from the
transcript, not the audio.

```
during the call   POST /api/advisor/voice     one turn at a time,
                                              transcript appended, qualification
                                              extracted as it goes

call ends         advisor-call-summary        supabase/functions/
                  Edge Function

                  POST /api/advisor/call-lead src/routes/api/advisor/call-lead.ts
                    → lead row in Supabase
                    → send-lead-emails        admin notification + client
                                              confirmation (Resend)
```

**The lead is written when the call ends, never mid-call.** A caller halfway
through giving a phone number would otherwise produce a lead with half a number
in it. The summary webhook has the whole transcript to work from.

Where the provider gives a detail directly (the caller's number, the call id),
that is trusted over the extractor's reading of the transcript — a number the
telephony layer captured is better evidence than a number a model heard.

### Wiring your telephony provider

Two webhooks to configure:

1. **Per turn** → `POST https://<site>/api/advisor/voice`
   Body: `{ callSid, utterance, callerNumber?, language?, speak? }`
   Header: the shared secret matching `VOICE_WEBHOOK_SECRET`.
   Returns: `{ reply, conversationId, audioBase64?, audioContentType? }`

   Set `speak: true` only if you want **us** to produce the audio through Fish
   Audio. Leave it off if your provider does its own text-to-speech — most
   stacks do, and doing it twice pays for it twice.

2. **On call end** → the `advisor-call-summary` Edge Function, which posts the
   finished transcript to `/api/advisor/call-lead`.

`/api/advisor/voice` refuses every request when `VOICE_WEBHOOK_SECRET` is unset.
That is intentional: unlike the chat it has no rate limiter in front of it, so
an unauthenticated version would be a free completion endpoint on the internet.

### Check the lead pipeline

Post a fake finished call to `/api/advisor/call-lead` with the shared secret and
a two-line transcript, then confirm a row appears in `leads` with source type
`voice_call` and that both Resend emails sent. If the row appears and the emails
do not, the problem is `send-lead-emails`, not this.

---

## 7. Reading answers aloud on the website

Separate, simpler path, same voice:

```
dock "read aloud"  → POST /api/advisor/speak   (src/routes/api/advisor/speak.ts)
                       → synthesize() → Fish Audio → audio/mpeg
```

- Rate limited on the same per-IP counter as the chat, because synthesis costs
  money per character.
- Hard-capped at 1,200 characters.
- **204 No Content** means "no voice configured" — the panel hides the control
  rather than showing one that fails.

This is an accessibility affordance first. Several of this site's audiences are
far more comfortable listening than reading English.

---

## 8. When there is no audio

Work down this list; it is ordered by how often each one is the answer.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Control never appears | No key visible to the server | Set `FISH_API`; `advisorAvailabilityFn` reports `voice: false` and the dock hides it |
| `204` from `/api/advisor/speak` | Same | As above |
| `402` in the logs | Free-tier key against the paid default model | `FISH_AUDIO_MODEL=s2.1-pro-free` |
| `401` in the logs | Key rejected | Re-copy it; check it is not a Lovable AI key by mistake |
| `429` | Our own per-IP limiter, not Fish Audio | Expected under load |
| Audio plays, wrong voice | `FISH_AUDIO_VOICE_ID` unset or wrong | Section 3 |
| Phone answers, says nothing | Provider not configured for our audio | Set `speak: true`, or let the provider speak |
| Every call refused | `VOICE_WEBHOOK_SECRET` unset | Set it on both sides |

---

## References

- [Text to Speech endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech)
- [Quick start](https://docs.fish.audio/developer-guide/getting-started/quickstart)
- [Manage voices](https://docs.fish.audio/features/manage-voices)
- [API introduction](https://docs.fish.audio/api-reference/introduction)
- [Free S2.1 Pro developer tier](https://fish.audio/blog/s2-1-pro-free-api/)

---

## 9. Voice Agents — the plan (not built)

A separate Fish Audio product from everything above. The agent holds the
conversation itself: prompt, knowledge, tools, and structured extraction of
what the caller said.

**Decided:** web only for now — the widget/SDK on the site, no phone number.
The `tel:` link stays as it is and reaches a person.

**Built from the API, not the console**, except the voice. The knowledge base
has to be rebuilt on every DLD export, and maintaining 56 communities of
changing figures by hand in a console is the second-pipeline problem this
codebase has already been bitten by twice. The prompt has to come from
`ADVISOR_POLICY` or the phone advisor and the chat advisor drift apart, which
CLAUDE.md forbids. Choosing the voice is a taste decision made by ear, and
publishing is a deliberate human act: live traffic runs the latest *published*
version, so nothing reaches a caller until someone presses publish.

### What the API gives us

| Thing | Endpoint | Limits that shape the design |
| --- | --- | --- |
| The agent | `/v1/agent/agents`, config at `/v1/agent/agents/{id}/config` | Draft autosaves; publish snapshots an immutable numbered version |
| Knowledge | `/v1/agent/knowledge-sources` (multipart) | **`.md` and `.txt` only**, 1 MB a file, 100 sources an agent |
| Extraction | `analysis.data_fields` on the agent config | Up to **20 fields**: name, type (boolean/text/number/enum), description, enum_options |
| Delivery | `webhooks.post_call[]`, up to 5 | HMAC-SHA256 in `X-Fish-Webhook-Signature`, at-least-once |

### On keywords

There is no keyword, vocabulary or pronunciation boosting in Fish Audio's
documentation, so a list of fifty keywords has nothing to attach to.

What actually decides whether the agent finds the right passage: a corpus over
**8 KB is searched on every turn, using the caller's latest sentence as the
query**, while anything under 8 KB is inlined whole. So retrieval is matched
against our documents' own wording, and the lever is writing the questions a
buyer actually asks *into* the documents. `knowledge-dld.server.ts` already
does this — every community entry carries the five phrasings people use
("what does property cost in X", "what is the service charge in X"). That is
the keyword list, except it matches whole questions rather than bare words.

It also settles how to shape the upload: one document per community, so a
question about one place retrieves that place rather than a slab containing
all of them.

### To build

1. Generate the knowledge documents from the real sources — the DLD figures
   per community, the two projects, the services, the guides and the fee
   schedule. Reuse `buildDldKnowledge()`, render `.md`.
2. A sync that creates, updates and prunes sources against
   `/v1/agent/knowledge-sources`, then attaches them by `knowledge_source_ids`.
   Re-run after every export.
3. Agent config from code: system prompt out of `ADVISOR_POLICY`, the
   `analysis.data_fields` mirroring the lead fields the forms already capture
   (intent, budget, timeline, name, contact), and the post-call webhook.
4. A receiver route that verifies the signature over `{t}.{raw body}`, rejects
   anything older than five minutes, deduplicates on
   (`event`, `session.id`, `analysis.finished_at`), and writes a lead through
   the path `/api/advisor/call-lead` already uses.
5. The widget on the site, replacing the current "answers can be read aloud"
   affordance with an actual conversation.

Transcripts are deliberately absent from webhook payloads; they are fetched
from the sessions API when the lead needs one attached.
