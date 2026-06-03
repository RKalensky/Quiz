import { supabase } from "./supabase";
import type { Answer, Player, Room, RoomPhase } from "../types";

/** Seconds players get to submit their fake answer in the "Варіанти" round. */
export const ANSWER_SECONDS = 60;

/**
 * Canonical stored form for every answer: trimmed and lower-cased so that no
 * option can be told apart from the truth by its capitalisation.
 */
export function toStored(text: string): string {
  return text.trim().toLowerCase();
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars

function randomCode(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// ── Rooms ────────────────────────────────────────────────────────────────

/** Create a fresh room, retrying on the rare code collision. */
export async function createRoom(): Promise<Room> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code })
      .select()
      .single();
    if (!error && data) return data as Room;
    if (error && error.code !== "23505") throw error; // 23505 = unique violation
  }
  throw new Error("Could not allocate a unique room code");
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as Room) ?? null;
}

export async function setPhase(roomId: string, phase: RoomPhase): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ phase })
    .eq("id", roomId);
  if (error) throw error;
}

/** Advance to the next question and reset the room to the answering phase. */
export async function goToQuestion(
  roomId: string,
  questionIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ question_index: questionIndex, phase: "answering" })
    .eq("id", roomId);
  if (error) throw error;
}

// ── Players ──────────────────────────────────────────────────────────────

export async function joinRoom(code: string, name: string): Promise<{
  room: Room;
  player: Player;
}> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Кімнату не знайдено. Перевір код.");

  const { data, error } = await supabase
    .from("players")
    .insert({ room_id: room.id, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return { room, player: data as Player };
}

// ── Answers ──────────────────────────────────────────────────────────────

export async function submitPlayerAnswer(
  roomId: string,
  questionIndex: number,
  playerId: string,
  text: string,
): Promise<void> {
  const stored = toStored(text);

  // No upsert/onConflict: the uniqueness index on (room, question, player) is
  // partial, which Postgres won't accept as an ON CONFLICT target. Find the
  // player's existing answer for this question and update it, else insert.
  const { data: existing, error: selErr } = await supabase
    .from("answers")
    .select("id")
    .eq("room_id", roomId)
    .eq("question_index", questionIndex)
    .eq("player_id", playerId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await supabase
      .from("answers")
      .update({ text: stored })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("answers").insert({
      room_id: roomId,
      question_index: questionIndex,
      player_id: playerId,
      text: stored,
      kind: "player",
    });
    if (error) throw error;
  }
}

/**
 * Insert the host distractor and the correct answer for the question.
 * Idempotent thanks to the singleton unique index.
 */
export async function revealAnswers(
  roomId: string,
  questionIndex: number,
  hostDistractor: string,
  correctAnswer: string,
): Promise<void> {
  // Replace any existing host/correct rows for this question so re-revealing
  // is safe. (Avoids onConflict against the partial singleton index.)
  const { error: delErr } = await supabase
    .from("answers")
    .delete()
    .eq("room_id", roomId)
    .eq("question_index", questionIndex)
    .in("kind", ["host", "correct"]);
  if (delErr) throw delErr;

  const { error } = await supabase.from("answers").insert([
    {
      room_id: roomId,
      question_index: questionIndex,
      text: toStored(hostDistractor),
      kind: "host",
    },
    {
      room_id: roomId,
      question_index: questionIndex,
      text: toStored(correctAnswer),
      kind: "correct",
    },
  ]);
  if (error) throw error;
}

/** A votable option. */
export interface VariantOption {
  answerId: string;
  text: string;
}

/**
 * Build the option list for a question. Every answer is shown as-is (no
 * de-duplication) — if a player happened to type the truth, their variant
 * appears alongside the real one. The order is randomised, seeded by the
 * question index so all clients show the same order.
 */
export function buildOptions(
  answers: Answer[],
  questionIndex: number,
): VariantOption[] {
  const options = answers
    .filter((a) => a.question_index === questionIndex)
    // Stable base order across clients, then a per-question deterministic shuffle.
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => ({ answerId: a.id, text: a.text }));

  let seed = questionIndex * 2654435761 + 1;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

// ── Votes ────────────────────────────────────────────────────────────────

export async function castVote(
  roomId: string,
  questionIndex: number,
  voterId: string,
  answerId: string,
): Promise<void> {
  const { error } = await supabase.from("votes").upsert(
    {
      room_id: roomId,
      question_index: questionIndex,
      voter_id: voterId,
      answer_id: answerId,
    },
    { onConflict: "room_id,question_index,voter_id" },
  );
  if (error) throw error;
}

/** Apply scoring for the question (host only, once). */
export async function tallyVotes(
  roomId: string,
  questionIndex: number,
): Promise<void> {
  const { error } = await supabase.rpc("tally_votes", {
    p_room: roomId,
    p_qindex: questionIndex,
  });
  if (error) throw error;
}
