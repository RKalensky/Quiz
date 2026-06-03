import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import game from "../config/game.json";
import type { VariantQuestion } from "../types";
import { useRoomState } from "../hooks/useRoomState";
import {
  buildOptions,
  castVote,
  joinRoom,
  submitPlayerAnswer,
} from "../lib/variants";

const questions = game.variants as VariantQuestion[];

interface Session {
  roomId: string;
  playerId: string;
  name: string;
}

function loadSession(code: string): Session | null {
  const raw = localStorage.getItem(`variants:${code.toUpperCase()}`);
  return raw ? (JSON.parse(raw) as Session) : null;
}

function JoinForm({ onJoined }: { onJoined: (code: string, s: Session) => void }) {
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { room, player } = await joinRoom(code, name);
      onJoined(room.code, { roomId: room.id, playerId: player.id, name: player.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося приєднатися");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-4xl! mb-8!">Варіанти</h1>
      <input
        className="w-full text-3xl text-center p-3 mb-4 rounded-lg bg-gray-900 border border-white tracking-widest uppercase"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="КОД"
        maxLength={4}
      />
      <input
        className="w-full text-2xl p-3 mb-4 rounded-lg bg-gray-900 border border-white"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Твоє ім'я"
      />
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <button
        className="w-full text-2xl! font-bold!"
        disabled={busy || !code.trim() || !name.trim()}
        onClick={submit}
      >
        Приєднатися
      </button>
    </div>
  );
}

function Game({ session }: { session: Session }) {
  const state = useRoomState(session.roomId);
  const room = state.room;
  const qIndex = room?.question_index ?? 0;
  const question = questions[qIndex];

  const [draft, setDraft] = useState("");
  useEffect(() => setDraft(""), [qIndex]);

  const myAnswer = useMemo(
    () =>
      state.answers.find(
        (a) => a.question_index === qIndex && a.player_id === session.playerId,
      ),
    [state.answers, qIndex, session.playerId],
  );

  const myVote = useMemo(
    () => state.votes.find((v) => v.question_index === qIndex && v.voter_id === session.playerId),
    [state.votes, qIndex, session.playerId],
  );

  const options = useMemo(
    () => buildOptions(state.answers, qIndex),
    [state.answers, qIndex],
  );

  const me = state.players.find((p) => p.id === session.playerId);

  if (!state.ready || !room) {
    return <h1 className="text-3xl!">Підключення…</h1>;
  }

  const submit = async () => {
    if (!draft.trim()) return;
    await submitPlayerAnswer(session.roomId, qIndex, session.playerId, draft);
  };

  const vote = async (answerId: string) => {
    await castVote(session.roomId, qIndex, session.playerId, answerId);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="text-xl mb-6">
        {session.name} · балів: <strong>{me?.score ?? 0}</strong>
      </p>

      {room.phase === "lobby" && (
        <h1 className="text-3xl!">Чекаємо на початок гри…</h1>
      )}

      {room.phase === "answering" && question && (
        <div>
          <p className="text-2xl font-bold mb-6">{question.prompt}</p>
          {myAnswer ? (
            <p className="text-2xl text-green-400">
              Прийнято: «{myAnswer.text}». Чекай на інших.
            </p>
          ) : (
            <>
              <input
                className="w-full text-2xl p-3 mb-4 rounded-lg bg-gray-900 border border-white"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Твій варіант"
              />
              <button className="w-full text-2xl! font-bold!" disabled={!draft.trim()} onClick={submit}>
                Відправити
              </button>
            </>
          )}
        </div>
      )}

      {room.phase === "reveal" && (
        <h1 className="text-3xl!">Дивись на екран — зараз будуть варіанти</h1>
      )}

      {room.phase === "voting" && (
        <div>
          <p className="text-2xl font-bold mb-6">За який варіант голосуєш?</p>
          {myVote ? (
            <p className="text-2xl text-green-400">Голос враховано!</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {options.map((o, i) => {
                const isMine = o.answerId === myAnswer?.id;
                return (
                  <li key={o.answerId}>
                    <button
                      className="w-full text-xl! py-4! disabled:opacity-30"
                      disabled={!!isMine}
                      onClick={() => vote(o.answerId)}
                    >
                      {i + 1}. {o.text}
                      {isMine ? " (твій)" : ""}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {room.phase === "results" && (
        <h1 className="text-3xl!">
          Твій рахунок: {me?.score ?? 0}. Дивись на екран!
        </h1>
      )}
    </div>
  );
}

export default function VariantsPlay() {
  const [params] = useSearchParams();
  const urlCode = (params.get("code") ?? "").toUpperCase();
  const [session, setSession] = useState<Session | null>(() =>
    urlCode ? loadSession(urlCode) : null,
  );

  const onJoined = (code: string, s: Session) => {
    localStorage.setItem(`variants:${code}`, JSON.stringify(s));
    setSession(s);
  };

  return session ? (
    <Game session={session} />
  ) : (
    <JoinForm onJoined={onJoined} />
  );
}
