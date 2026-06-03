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

export type RoomPhase =
  | "lobby"
  | "answering"
  | "reveal"
  | "voting"
  | "results";

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
}

export interface Vote {
  id: string;
  room_id: string;
  question_index: number;
  voter_id: string;
  answer_id: string;
}
