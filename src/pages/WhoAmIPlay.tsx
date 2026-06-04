import { useMemo } from "react";
import { useRoomState } from "../hooks/useRoomState";
import PhoneClient from "../components/PhoneClient";
import type { Session } from "../lib/session";
import { buzz } from "../lib/whoami";

function Buzzer({ session }: { session: Session }) {
  const state = useRoomState(session.roomId);
  const room = state.room;
  // question_index encodes character+hint, so it changes on every new hint —
  // recomputing myBuzz against it clears (unlocks) the button each time.
  const qIndex = room?.question_index ?? 0;

  const myBuzz = useMemo(
    () =>
      state.answers.find(
        (a) => a.question_index === qIndex && a.player_id === session.playerId,
      ),
    [state.answers, qIndex, session.playerId],
  );

  if (!state.ready || !room) {
    return <h1 className="text-3xl!">Підключення…</h1>;
  }

  const press = async () => {
    await buzz(session.roomId, qIndex, session.playerId);
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
  return (
    <PhoneClient title="Хто я?" namespace="whoami">
      {(session) => <Buzzer session={session} />}
    </PhoneClient>
  );
}
