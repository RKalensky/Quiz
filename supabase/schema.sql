-- ============================================================================
-- Quiz · activity "Варіанти" (Fibbage-style) schema for Supabase.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists rooms (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  -- lobby | answering | reveal | voting | results
  phase          text not null default 'lobby',
  question_index int  not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  name       text not null,
  score      int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references rooms(id) on delete cascade,
  question_index int  not null,
  -- null for host distractor and the correct answer
  player_id      uuid references players(id) on delete cascade,
  text           text not null,
  -- player | host | correct
  kind           text not null default 'player',
  created_at     timestamptz not null default now()
);

create table if not exists votes (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references rooms(id) on delete cascade,
  question_index int  not null,
  voter_id       uuid not null references players(id) on delete cascade,
  answer_id      uuid not null references answers(id) on delete cascade,
  created_at     timestamptz not null default now(),
  -- one vote per player per question
  unique (room_id, question_index, voter_id)
);

-- A player submits at most one answer per question; there is at most one
-- host distractor and one correct answer per question.
create unique index if not exists answers_player_unique
  on answers (room_id, question_index, player_id)
  where player_id is not null;

create unique index if not exists answers_singleton_unique
  on answers (room_id, question_index, kind)
  where kind in ('host', 'correct');

-- ---------------------------------------------------------------------------
-- Scoring. Called once by the host when moving voting → results.
--   * vote for the correct answer  -> voter            +1
--   * vote for the host distractor -> voter            -1
--   * vote for another player      -> that player (author) +1
-- Idempotency: callers pass a fresh question only once; re-runs would
-- double-count, so the host UI guards against calling it twice.
-- ---------------------------------------------------------------------------

create or replace function tally_votes(p_room uuid, p_qindex int)
returns void
language plpgsql
security definer
as $$
begin
  -- voter +1 for choosing the correct answer
  update players p
     set score = score + 1
    from votes v
    join answers a on a.id = v.answer_id
   where v.room_id = p_room
     and v.question_index = p_qindex
     and a.kind = 'correct'
     and v.voter_id = p.id;

  -- voter -1 for falling for the host's distractor
  update players p
     set score = score - 1
    from votes v
    join answers a on a.id = v.answer_id
   where v.room_id = p_room
     and v.question_index = p_qindex
     and a.kind = 'host'
     and v.voter_id = p.id;

  -- author +1 for every vote their fake answer attracted
  update players p
     set score = score + sub.cnt
    from (
      select a.player_id as author, count(*) as cnt
        from votes v
        join answers a on a.id = v.answer_id
       where v.room_id = p_room
         and v.question_index = p_qindex
         and a.kind = 'player'
       group by a.player_id
    ) sub
   where sub.author = p.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: stream row changes to subscribed clients.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table votes;

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- This is an anonymous party game with no auth, so we allow the anon role
-- full access. That is fine for a casual game run from a laptop; do NOT
-- reuse this project for anything sensitive.
-- ---------------------------------------------------------------------------

alter table rooms   enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table votes   enable row level security;

create policy "anon all rooms"   on rooms   for all to anon using (true) with check (true);
create policy "anon all players" on players for all to anon using (true) with check (true);
create policy "anon all answers" on answers for all to anon using (true) with check (true);
create policy "anon all votes"   on votes   for all to anon using (true) with check (true);
