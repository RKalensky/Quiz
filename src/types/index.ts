export interface Stump {
  category: string;
  agenda: string;
  easyQuestion: string;
  hardQuestion: string;
}

export type FiveTen = string[];

export type FourForForty = string[];

// ── Activity "Варіанти" (Fibbage-style) ──────────────────────────────────

/** A question with a gap (marked by "…") whose answer players try to fake. */
export interface VariantQuestion {
  /** Sentence shown on screen; the gap is written as "…". */
  prompt: string;
  /** The real missing word/phrase. */
  answer: string;
}

// ── Activity "Хто я?" (buzzer guessing) ───────────────────────────────────

/** A character revealed through five clues, ordered hardest → easiest. */
export interface WhoAmIQuestion {
  /** The secret character (host reference only — never the screen headline). */
  character: string;
  /** Five hints from the most cryptic to the most obvious. */
  hints: string[];
}

export type RoomPhase =
  | "lobby"
  | "answering"
  | "reveal"
  | "voting"
  | "results"
  // "Хто я?" only ever uses lobby → playing.
  | "playing";

export type AnswerKind = "player" | "host" | "correct";

export interface Room {
  id: string;
  code: string;
  phase: RoomPhase;
  question_index: number;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  score: number;
}

export interface Answer {
  id: string;
  room_id: string;
  question_index: number;
  player_id: string | null;
  text: string;
  kind: AnswerKind;
  /** Set by the DB; used by "Хто я?" to order buzzes by press time. */
  created_at?: string;
}

export interface Vote {
  id: string;
  room_id: string;
  question_index: number;
  voter_id: string;
  answer_id: string;
}
