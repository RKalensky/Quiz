# Interactive Quiz Game

An interactive quiz game for two teams. The game consists of several rounds where participants can earn points.

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project — **only required for the
  multiplayer "Варіанти" activity**. The other rounds (Stump, Five-Ten, Four
  for Forty) work fully offline without it.

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the backend (Supabase)

Needed only for the "Варіанти" activity. Skip to step 4 if you don't need it.

1. Create a project at [supabase.com](https://supabase.com) (the free tier is
   enough). Save the database password it asks you to set.
2. In the dashboard open **SQL Editor → New query**, paste the entire contents
   of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

Running that one script is all you need — it creates everything described
below. The breakdown is here so you understand (or can recreate) the schema by
hand in the **Table Editor**.

#### Tables

**`rooms`** — one row per game session.

| Column           | Type          | Constraints / default                   | Notes                                            |
| ---------------- | ------------- | --------------------------------------- | ------------------------------------------------ |
| `id`             | `uuid`        | PK, default `gen_random_uuid()`         | room identifier                                  |
| `code`           | `text`        | **unique**, not null                    | short join code shown on screen (e.g. `K7Q2`)    |
| `phase`          | `text`        | not null, default `'lobby'`             | `lobby` → `answering` → `reveal` → `voting` → `results` |
| `question_index` | `int`         | not null, default `0`                   | index into `game.json` → `variants`              |
| `created_at`     | `timestamptz` | not null, default `now()`               |                                                  |

**`players`** — one row per joined phone.

| Column       | Type          | Constraints / default                          | Notes                          |
| ------------ | ------------- | ---------------------------------------------- | ------------------------------ |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                |                                |
| `room_id`    | `uuid`        | not null, FK → `rooms(id)` **on delete cascade** |                              |
| `name`       | `text`        | not null                                       | display name entered on join   |
| `score`      | `int`         | not null, default `0`                          | updated by `tally_votes`       |
| `created_at` | `timestamptz` | not null, default `now()`                      |                                |

**`answers`** — every submitted variant for every question.

| Column           | Type          | Constraints / default                              | Notes                                                  |
| ---------------- | ------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `id`             | `uuid`        | PK, default `gen_random_uuid()`                    |                                                        |
| `room_id`        | `uuid`        | not null, FK → `rooms(id)` **on delete cascade**   |                                                        |
| `question_index` | `int`         | not null                                           | which question this answer belongs to                  |
| `player_id`      | `uuid`        | nullable, FK → `players(id)` **on delete cascade** | `null` for the host distractor and the correct answer  |
| `text`           | `text`        | not null                                           | stored trimmed + lower-cased                           |
| `kind`           | `text`        | not null, default `'player'`                       | `player` \| `host` \| `correct`                        |
| `created_at`     | `timestamptz` | not null, default `now()`                          |                                                        |

**`votes`** — one row per player per question.

| Column           | Type          | Constraints / default                            | Notes                          |
| ---------------- | ------------- | ------------------------------------------------ | ------------------------------ |
| `id`             | `uuid`        | PK, default `gen_random_uuid()`                  |                                |
| `room_id`        | `uuid`        | not null, FK → `rooms(id)` **on delete cascade** |                                |
| `question_index` | `int`         | not null                                         |                                |
| `voter_id`       | `uuid`        | not null, FK → `players(id)` **on delete cascade** | who voted                    |
| `answer_id`      | `uuid`        | not null, FK → `answers(id)` **on delete cascade** | the chosen variant           |
| `created_at`     | `timestamptz` | not null, default `now()`                        |                                |

#### Indexes / uniqueness rules

- `votes`: `unique (room_id, question_index, voter_id)` — one vote per player
  per question.
- `answers_player_unique`: `unique (room_id, question_index, player_id) where player_id is not null`
  — a player can submit at most one variant per question.
- `answers_singleton_unique`: `unique (room_id, question_index, kind) where kind in ('host', 'correct')`
  — at most one host distractor and one correct answer per question.

#### Scoring function

`tally_votes(p_room uuid, p_qindex int) returns void` — called once by the host
when moving from voting to results. It adjusts `players.score`:

- voter of the `correct` answer → `+1`
- voter of the `host` distractor → `−1`
- author of a `player` variant → `+1` per vote it received

#### Realtime

The four tables are added to the `supabase_realtime` publication so clients get
live row changes (no polling). If you build the tables by hand, run:

```sql
alter publication supabase_realtime add table rooms, players, answers, votes;
```

#### Row Level Security

RLS is **enabled** on all four tables with policies that grant the `anon` role
full access (`using (true) with check (true)`).

> ⚠️ This is intentional for an anonymous, no-login party game run from a
> laptop. Anyone with the anon key can read/write these tables, so **do not
> reuse this project for anything sensitive**.

### 3. Configure environment variables

Copy the example file and fill in the two values from your Supabase project
(**Project Settings → API**):

```bash
cp .env.example .env.local
```

```dotenv
# .env.local
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY

# Optional: base URL embedded in the join QR code (see step 4).
VITE_PUBLIC_BASE_URL=
```

The Supabase client is initialised lazily, so the app (and the offline rounds)
still run even if these are left blank — only the "Варіанти" activity will
error until they are set.

### 4. Run in development

```bash
npm run dev
```

Vite prints two URLs:

- **Local** (`http://localhost:5173`)
- **Network** (`http://192.168.x.x:5173`) — reachable from other devices on the
  same Wi-Fi.

> **Important for the "Варіанти" join QR.** The QR encodes the address phones
> should open, taken from however the **host screen** was opened. If you open
> the host screen at `localhost`, the QR will point at `localhost` and phones
> can't reach it. Either:
>
> - open the host screen (`/variants`) on the laptop using the **Network** URL,
>   so the QR uses the LAN IP, **or**
> - set `VITE_PUBLIC_BASE_URL` in `.env.local` to the address phones should use
>   (LAN IP, a tunnel URL, or your deployed domain), e.g.
>   `VITE_PUBLIC_BASE_URL=http://192.168.0.10:5173`.
>
> Phones must be on the **same Wi-Fi** as the laptop (unless you use a tunnel or
> deploy the app).

### Production build & preview

```bash
npm run build    # type-check + bundle into dist/
npm run preview  # serve the production build locally
```

## Game Rounds

- **Stump** — round with categories featuring an easy and a hard question
- **Five-Ten** — round with word lists
- **Four for Forty** — round with categories for quick answers

## Configuration File `game.json`

The file `src/config/game.json` contains all the quiz data:

### Structure

```json
{
  "stump": [
    ...
  ],
  "fiveTen": [
    ...
  ],
  "FourForForty": [
    ...
  ]
}
```

### `stump` — array of objects for the "Stump" round

Each object has the following fields:

- `category` — category name
- `agenda` — hint/description of the category
- `easyQuestion` — easy question
- `hardQuestion` — hard question

### `fiveTen` — array of strings for the "Five-Ten" round

List of categories (e.g., "pronouns", "Hollywood actors", "bird species")

### `FourForForty` — array of strings for the "Four for Forty" round

List of categories for quick answers (e.g., "Name", "Animal", "City", "Character")

### `variants` — array of objects for the multiplayer "Варіанти" activity

Each object:

- `prompt` — the sentence shown on screen, with the gap written as `…`
- `answer` — the real missing word/phrase

The time players get to submit is a constant (`ANSWER_SECONDS` in
`src/lib/variants.ts`), not a per-question field.

## Activity "Варіанти" (multiplayer, Supabase)

A Fibbage-style bluffing round. A question with a gap appears on the shared
screen; every player submits a fake answer from their phone, the host adds one
distractor too, then everyone votes.

Make sure the backend is configured first (Getting Started, steps 2–3).

### Running the activity

- The laptop (shared screen / projector) opens **`/variants`** — it creates a
  room and shows a join code + QR.
- Players open **`/play`** on their phones (scan the QR or type the code +
  name), using the **Network** URL from `npm run dev`.
- The host drives the phases from the shared screen — **start → reveal → vote →
  results → next question** — and types their own distractor each round.

### Rules & scoring

- All answers are stored and shown in **lowercase**, so the real answer can't
  be spotted by its capitalisation.
- Every submitted variant is shown — duplicates are **not** merged, even if a
  player happens to type the real answer.
- Players vote exactly once and cannot vote for their own variant.
- Scoring (applied when the host moves from voting to results):
  - voting for the **correct** answer → **+1** to the voter
  - voting for the **host's** distractor → **−1** to the voter
  - voting for **another player's** variant → **+1** to that variant's author

### Database cleanup

Each session creates a `rooms` row (plus its players / answers / votes). To
clear out stale data, run the cleanup script — deleting a room cascades to all
of its related rows, so only rooms need to be removed. It reads the same
Supabase credentials from `.env.local`.

```bash
npm run db:cleanup                 # delete rooms older than 12h (default)
npm run db:cleanup -- --older-than=2   # older than 2 hours
npm run db:cleanup -- --all            # delete ALL rooms
npm run db:cleanup -- --dry-run        # show what would be deleted, delete nothing
```

