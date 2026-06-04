import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useRoomState } from "../hooks/useRoomState";
import { buzz, joinRoom } from "../lib/whoami";

interface Session {
  roomId: string;
  playerId: string;
  name: string;
}

function loadSession(code: string): Session | null {
  const raw = localStorage.getItem(`whoami:${code.toUpperCase()}`);
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
      <h1 className="text-4xl! mb-8!">Хто я?</h1>
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

function Buzzer({ session }: { session: Session }) {
  const state = useRoomState(session.roomId);
  const room = state.room;
  const index = room?.question_index ?? 0;

  // My buzz for the current character, if any. Recomputed (→ cleared) whenever
  // the host advances to the next character.
  const myBuzz = useMemo(
    () =>
      state.answers.find(
        (a) => a.question_index === index && a.player_id === session.playerId,
      ),
    [state.answers, index, session.playerId],
  );

  if (!state.ready || !room) {
    return <h1 className="text-3xl!">Підключення…</h1>;
  }

  const press = async () => {
    await buzz(session.roomId, index, session.playerId);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="text-xl mb-8">{session.name}</p>

      {room.phase === "lobby" && (
        <h1 className="text-3xl!">Чекаємо на початок гри…</h1>
      )}

      {room.phase === "playing" &&
        (myBuzz ? (
          <p className="text-4xl text-green-400 font-bold">
            Ти натиснув! Чекай ведучого.
          </p>
        ) : (
          <button
            className="w-full text-5xl! font-bold! py-16! rounded-3xl!"
            onClick={press}
          >
            Це я!
          </button>
        ))}
    </div>
  );
}

export default function WhoAmIPlay() {
  const [params] = useSearchParams();
  const urlCode = (params.get("code") ?? "").toUpperCase();
  const [session, setSession] = useState<Session | null>(() =>
    urlCode ? loadSession(urlCode) : null,
  );

  const onJoined = (code: string, s: Session) => {
    localStorage.setItem(`whoami:${code}`, JSON.stringify(s));
    setSession(s);
  };

  return session ? <Buzzer session={session} /> : <JoinForm onJoined={onJoined} />;
}
