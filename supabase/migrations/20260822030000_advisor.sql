-- The AI advisor: conversations, transcripts and call summaries.
--
-- The chat and the voice agent share one brain, so they share one table. A
-- conversation is the unit: it opens when someone starts talking, accumulates
-- turns, and — if the person tells us who they are — attaches to a lead.
--
-- Two ideas shape this.
--
-- CONVERSATIONS ARE PRIVATE. A visitor's questions about their budget, their
-- residency and their family are not public evidence the way DLD figures are.
-- Nobody reads this table but the service role and an admin. The browser never
-- reads it at all: the chat holds its own turns in memory and the server writes
-- them, so there is no policy allowing anon to select their "own" conversation
-- and therefore no token to guess.
--
-- THE TRANSCRIPT IS THE RECORD. Both channels store their turns in the same
-- jsonb shape, so the admin renders a phone call and a chat identically and a
-- later phase can train, audit or export either without a second code path.

create type advisor_channel as enum ('chat', 'voice');

-- ---------------------------------------------------------------------------
-- advisor_conversations — one chat session or one phone call
-- ---------------------------------------------------------------------------

create table public.advisor_conversations (
  id uuid primary key default gen_random_uuid(),
  channel advisor_channel not null,

  -- The browser's handle on its own session. Random, unguessable, and never a
  -- key anything is read by: the server looks a conversation up by this only
  -- when it already holds the service role.
  session_token text not null unique,

  -- BCP-47 as best we can detect it. The advisor answers in the language it
  -- was asked in, and the admin needs to know which that was.
  language text not null default 'en',

  -- The turns, oldest first:
  --   [{ "role": "user" | "advisor", "content": "…", "at": "2026-08-22T…Z",
  --      "citations": [{ "label": "…", "url": "…", "updatedAt": "…" }] }]
  -- Citations are stored with the turn that made them, so an audit can check
  -- what the advisor claimed against what it was given.
  transcript jsonb not null default '[]'::jsonb,

  -- Written by the summariser at the end of a call, or when a chat converts.
  summary text,

  -- What the advisor managed to qualify, in the lead's own vocabulary.
  -- Mirrors leads.qualification_answers so scoring reads one shape.
  qualification jsonb not null default '{}'::jsonb,

  -- Set once the person identifies themselves and a lead is written.
  lead_id uuid references public.leads (id) on delete set null,

  -- Telephony's own identifier, so a webhook arriving twice updates rather
  -- than duplicating. Null for chat.
  call_sid text unique,
  call_seconds integer check (call_seconds >= 0),
  caller_number text,

  -- Cheap abuse and cost control. The endpoint refuses past a cap rather than
  -- letting one session spend the month's budget.
  turn_count integer not null default 0 check (turn_count >= 0),
  ip_hash text,

  started_at timestamptz not null default now(),
  last_turn_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No grant to anon, and an explicit revoke so a default privilege cannot
-- quietly hand it one. RLS below is the second lock; this is the first.
revoke all on public.advisor_conversations from anon;
grant select, insert, update, delete on public.advisor_conversations to authenticated;
grant all on public.advisor_conversations to service_role;

create index advisor_conversations_recent_idx
  on public.advisor_conversations (created_at desc);
create index advisor_conversations_lead_idx
  on public.advisor_conversations (lead_id)
  where lead_id is not null;

create trigger advisor_conversations_set_updated_at
  before update on public.advisor_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.advisor_conversations enable row level security;

-- Deliberately no anon policy of any kind. The chat endpoint runs with the
-- service role, which bypasses RLS; a visitor's browser has no reason to read
-- or write this table directly and no way to.
create policy "Admins read conversations"
  on public.advisor_conversations for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

create policy "Admins manage conversations"
  on public.advisor_conversations for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));
