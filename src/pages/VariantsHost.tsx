import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import type { Player, Room, VariantQuestion } from "../types";
import { useRoomState } from "../hooks/useRoomState";
import { isLocalhostUrl, resolveBaseUrl } from "../lib/baseUrl";
import {
  ANSWER_SECONDS,
  buildOptions,
  createRoom,
  goToQuestion,
  revealAnswers,
  setPhase,
  tallyVotes,
  toStored,
} from "../lib/variants";

function Scoreboard({ players }: { players: Player[] }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <ul className="text-4xl flex flex-col gap-3 max-w-2xl mx-auto">
      {ranked.map((p, i) => (
        <li
          key={p.id}
          className="flex justify-between border-b border-white/20 pb-2"
        >
          <span>
            {i + 1}. {p.name}
          </span>
          <span className="font-bold">{p.score}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VariantsHost() {
  const questions = useLoaderData() as VariantQuestion[];
  const [room, setRoom] = useState<Room | null>(null);
  const createdRef = useRef(false);

  // Create the room exactly once (guard against StrictMode double-invoke).
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void createRoom().then(setRoom);
  }, []);

  const state = useRoomState(room?.id ?? null);
  const live = state.room ?? room;
  const qIndex = live?.question_index ?? 0;
  const question = questions[qIndex];

  const [hostDistractor, setHostDistractor] = useState("");
  const [busy, setBusy] = useState(false);

  // Per-question countdown, restarted whenever we (re-)enter answering.
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (live?.phase !== "answering" || !question) return;
    setSecondsLeft(ANSWER_SECONDS);
    const id = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(id);
  }, [live?.phase, qIndex, question]);

  const submittedCount = useMemo(
    () =>
      state.answers.filter(
        (a) => a.question_index === qIndex && a.kind === "player",
      ).length,
    [state.answers, qIndex],
  );

  const voteCount = useMemo(
    () => state.votes.filter((v) => v.question_index === qIndex).length,
    [state.votes, qIndex],
  );

  const options = useMemo(
    () => buildOptions(state.answers, qIndex),
    [state.answers, qIndex],
  );

  if (!live || !state.ready) {
    return <h1>Створюємо кімнату…</h1>;
  }

  const joinUrl = `${resolveBaseUrl()}/play?code=${live.code}`;

  const reveal = async () => {
    if (!hostDistractor.trim()) return;
    setBusy(true);
    try {
      await revealAnswers(room!.id, qIndex, hostDistractor, question.answer);
      await setPhase(room!.id, "reveal");
    } finally {
      setBusy(false);
    }
  };

  const showResults = async () => {
    setBusy(true);
    try {
      await tallyVotes(room!.id, qIndex);
      await setPhase(room!.id, "results");
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    setHostDistractor("");
    await goToQuestion(room!.id, qIndex + 1);
  };

  const hasNext = qIndex + 1 < questions.length;

  return (
    <div>
      <h1 className="text-6xl! mb-10!">Варіанти</h1>

      {/* ── Lobby ─────────────────────────────────────────────────────── */}
      {live.phase === "lobby" && (
        <div className="text-center">
          <p className="text-4xl mb-6">Зайди з телефону та скануй QR:</p>
          <p className="text-9xl font-bold tracking-widest mb-8">{live.code}</p>
          <div className="inline-block bg-white p-4 rounded-lg mb-10">
            <QRCodeSVG value={joinUrl} size={260} />
          </div>
          {isLocalhostUrl(joinUrl) && (
            <p className="text-2xl text-red-400 mb-6 max-w-2xl mx-auto">
              ⚠ QR вказує на localhost — телефони його не відкриють. Відкрий цей
              екран через Network-URL (напр. http://192.168.x.x:5173) або задай
              VITE_PUBLIC_BASE_URL.
            </p>
          )}
          <p className="text-3xl mb-6">
            Гравців: <strong>{state.players.length}</strong>
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10 text-2xl">
            {state.players.map((p) => (
              <span
                key={p.id}
                className="border border-white rounded-lg px-4 py-2"
              >
                {p.name}
              </span>
            ))}
          </div>
          <button
            className="text-4xl! font-bold!"
            disabled={state.players.length === 0}
            onClick={() => setPhase(room!.id, "answering")}
          >
            Почати гру
          </button>
        </div>
      )}

      {/* ── Answering ─────────────────────────────────────────────────── */}
      {live.phase === "answering" && question && (
        <div className="text-center">
          <p className="text-7xl font-bold leading-tight mb-10">
            {question.prompt}
          </p>
          <p
            className={`text-8xl font-bold mb-8 ${secondsLeft <= 10 ? "text-red-500" : ""}`}
          >
            {secondsLeft}
          </p>
          <p className="text-4xl mb-10">
            Відповіли: <strong>{submittedCount}</strong> /{" "}
            {state.players.length}
          </p>
          <div className="max-w-2xl mx-auto mb-8">
            <label className="block text-2xl mb-3">
              Твій дистрактор (ведучий):
            </label>
            <input
              className="w-full text-3xl p-3 rounded-lg bg-gray-900 border border-white"
              value={hostDistractor}
              onChange={(e) => setHostDistractor(e.target.value)}
              placeholder="Введи фальшивий варіант"
            />
          </div>
          <button
            className="text-3xl! font-bold!"
            disabled={busy || !hostDistractor.trim()}
            onClick={reveal}
          >
            Завершити прийом і показати варіанти
          </button>
        </div>
      )}

      {/* ── Reveal ────────────────────────────────────────────────────── */}
      {live.phase === "reveal" && question && (
        <div className="text-center">
          <p className="text-5xl font-bold mb-10">{question.prompt}</p>
          <ul className="grid grid-cols-2 gap-6 max-w-5xl mx-auto mb-10">
            {options.map((o, i) => (
              <li
                key={o.answerId}
                className="text-4xl font-bold border-2 border-white rounded-lg p-6"
              >
                {i + 1}. {o.text}
              </li>
            ))}
          </ul>
          <button
            className="text-3xl! font-bold!"
            onClick={() => setPhase(room!.id, "voting")}
          >
            Почати голосування
          </button>
        </div>
      )}

      {/* ── Voting ────────────────────────────────────────────────────── */}
      {live.phase === "voting" && question && (
        <div className="text-center">
          <p className="text-5xl font-bold mb-10">{question.prompt}</p>
          <ul className="grid grid-cols-2 gap-6 max-w-5xl mx-auto mb-10">
            {options.map((o, i) => (
              <li
                key={o.answerId}
                className="text-4xl font-bold border-2 border-white rounded-lg p-6"
              >
                {i + 1}. {o.text}
              </li>
            ))}
          </ul>
          <p className="text-4xl mb-8">
            Проголосували: <strong>{voteCount}</strong> / {state.players.length}
          </p>
          <button
            className="text-3xl! font-bold!"
            disabled={busy}
            onClick={showResults}
          >
            Показати результати
          </button>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {live.phase === "results" && question && (
        <div className="text-center">
          <p className="text-4xl mb-4">Правильна відповідь:</p>
          <p className="text-7xl font-bold text-green-400 mb-12">
            {toStored(question.answer)}
          </p>
          <Scoreboard players={state.players} />
          <div className="mt-12">
            {hasNext ? (
              <button className="text-3xl! font-bold!" onClick={next}>
                Наступне питання
              </button>
            ) : (
              <p className="text-4xl">Це було останнє питання.</p>
            )}
          </div>
        </div>
      )}

      {/* Show answer key for the host on every non-results phase. */}
      {question && live.phase !== "results" && live.phase !== "lobby" && (
        <p className="fixed bottom-4 left-4 text-lg text-white/40">
          Правильна: {question.answer}
          {toStored(hostDistractor) === toStored(question.answer)
            ? " · ⚠ твій дистрактор збігається з правильною"
            : ""}
        </p>
      )}
    </div>
  );
}
