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

## 9. Voice Agents — turning it on

Built. Three commands and two secrets, and nothing reaches a caller until you
publish.

### What runs where

| Piece | Where it lives |
| --- | --- |
| Provisioning | `scripts/fish-agent.mjs` |
| Prompt and knowledge | built from `/advisor-knowledge.json`, the same index the chat advisor uses |
| Lead capture | `POST /api/advisor/fish-webhook` |
| The call surface | `src/components/advisor/voice-call.tsx`, inside our own dock |

### Secrets to add

| Variable | When | What it is |
| --- | --- | --- |
| `FISH_WEBHOOK_SECRET` | before the first run | Any long random string. Signs the post-call webhook; without it the route refuses every request. |
| `FISH_AGENT_ID` | after the first run | Printed by the script. Set it so later runs update the agent instead of creating another, and so the talk button appears. |
| `FISH_VOICE_ID` | optional | Pins the voice. Unset, the script picks one and prints it. |

### Running it

```bash
export FISH_API=...            # the key already in Lovable
export FISH_WEBHOOK_SECRET=... # the one you just added

node scripts/fish-agent.mjs --voices    # see the candidate voices
node scripts/fish-agent.mjs             # build the draft, change nothing live
node scripts/fish-agent.mjs --publish   # make it the version callers hear
```

Re-run it after every DLD export. Sources are matched by title and updated in
place, so it never duplicates.

### The voice, and the emotion

The script ranks English voices that Fish's own catalogue tags female, by
usage, and prints its choice. A voice id is not hard-coded because a
32-character id pasted into a file is unverifiable until it runs and then fails
at the worst possible moment.

Emotion is a **separate setting from the voice**: `voice.expressive`, which the
script sets to `true`. It lets the voice add its own emphasis, natural pauses
and contractions, and those cues are never spoken and never reach a transcript.
Speed is set to 0.95, slightly under natural, because this advisor reads
numbers aloud and a misheard figure is the one failure that costs somebody
money.

### Keywords

There is no keyword or vocabulary boosting in Fish Audio. What decides
retrieval is that a corpus over 8 KB is searched on every turn **using the
caller's own sentence as the query**. So the wording inside our documents is
the matching surface, and the script uploads one document per entry, each
opening with the questions people actually ask. That is the keyword list,
except it matches whole questions instead of bare words, and it is generated
rather than maintained.

### What a finished call writes

Fish extracts the fields the script configures (`analysis.data_fields`) and
posts them. The webhook verifies HMAC-SHA256 over `{timestamp}.{raw body}` in
constant time, rejects anything older than five minutes, ignores `call.ended`
because only `call.analyzed` carries the fields, and writes a lead through the
same `captureLead` path the forms use. Intent and timeline use the site's own
vocabularies, so they map straight through; anything outside them is dropped
rather than coerced into a value a consultant would act on.

Transcripts are deliberately absent from Fish's payloads. Fetch one from the
sessions API against the session id on the lead when a consultant needs it.

### One thing to check on deploy

The call surface loads `https://unpkg.com/@fishaudio/agent-widget-embed` on
demand. If a Content-Security-Policy is ever added to this site, that host
needs to be on the script allowlist or the talk button will open a panel that
says the voice line will not start.
