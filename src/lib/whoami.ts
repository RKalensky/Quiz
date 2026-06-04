import { supabase } from "./supabase";
import type { Answer } from "../types";

// Room creation and joining are activity-agnostic, so the "Хто я?" host and
// phone reuse them straight from the "Варіанти" lib rather than duplicating.
export { createRoom, getRoomByCode, joinRoom } from "./variants";

export const HINTS_PER_CHARACTER = 5;

/**
 * "Хто я?" keeps both the current character and the current revealed hint in a
 * single `rooms.question_index`, encoded as `character * STRIDE + hint`. This
 * needs no extra columns, and — crucially — every new hint is a fresh value,
 * so it both syncs hint reveals to the phones in realtime and (via the unique
 * index on answers) lets each player buzz again once per hint.
 */
const STRIDE = 1000;

export function characterOf(questionIndex: number): number {
  return Math.floor(questionIndex / STRIDE);
}

export function hintOf(questionIndex: number): number {
  return questionIndex % STRIDE;
}

/** Leave the lobby and start on the first character's first hint. */
export async function startGame(roomId: string): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ phase: "playing", question_index: 0 })
    .eq("id", roomId);
  if (error) throw error;
}

/** Reveal the next hint of the current character (host guards the cap). */
export async function revealNextHint(
  roomId: string,
  questionIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ question_index: questionIndex + 1 })
    .eq("id", roomId);
  if (error) throw error;
}

/** Advance to the next character's first hint; phase stays "playing". */
export async function goToNextCharacter(
  roomId: string,
  questionIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ question_index: (characterOf(questionIndex) + 1) * STRIDE })
    .eq("id", roomId);
  if (error) throw error;
}

/**
 * Record that a player pressed the buzzer for the current character+hint. A
 * buzz is stored as a plain answer row; the partial unique index on
 * (room, question_index, player_id) means each player can buzz a given hint
 * exactly once, and a new hint (new question_index) unlocks the button again.
 */
export async function buzz(
  roomId: string,
  questionIndex: number,
  playerId: string,
): Promise<void> {
  const { error } = await supabase.from("answers").insert({
    room_id: roomId,
    question_index: questionIndex,
    player_id: playerId,
    text: "buzz",
    kind: "player",
  });
  // 23505 = unique violation: the player already buzzed this hint; ignore it.
  if (error && error.code !== "23505") throw error;
}

/** Buzzes for one character+hint, earliest press first. */
export function buzzOrder(answers: Answer[], questionIndex: number): Answer[] {
  return answers
    .filter((a) => a.question_index === questionIndex && a.player_id)
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
}
