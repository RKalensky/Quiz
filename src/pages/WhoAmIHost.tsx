import { useMemo, useState } from "react";
import { useLoaderData } from "react-router";
import type { WhoAmIQuestion } from "../types";
import { useHostRoom } from "../hooks/useHostRoom";
import { resolveBaseUrl } from "../lib/baseUrl";
import Lobby from "../components/Lobby";
import {
  buzzOrder,
  characterOf,
  goToNextCharacter,
  hintOf,
  HINTS_PER_CHARACTER,
  revealNextHint,
  startGame
} from "../lib/whoami";
import Modal from "../components/Modal.tsx";

export default function WhoAmIHost() {
  const characters = useLoaderData() as WhoAmIQuestion[];
  const { room, live, state } = useHostRoom();
  const [showCharacter, setShowCharacter] = useState<boolean>(false);

  // question_index encodes both the character and the current hint.
  const qIndex = live?.question_index ?? 0;
  const charIndex = characterOf(qIndex);
  const revealed = hintOf(qIndex) + 1; // hint 0 = first hint shown
  const character = characters[charIndex];

  const buzzes = useMemo(
    () =>
      buzzOrder(state.answers, qIndex).map((a) => {
        const player = state.players.find((p) => p.id === a.player_id);
        return { id: a.id, name: player?.name ?? "?" };
      }),
    [state.answers, state.players, qIndex],
  );

  if (!live || !state.ready) {
    return <h1>Створюємо кімнату…</h1>;
  }

  const joinUrl = `${resolveBaseUrl()}/buzz?code=${live.code}`;
  const hasNext = charIndex + 1 < characters.length;

  const next = async () => {
    await goToNextCharacter(room!.id, qIndex);
  };

  const revealCharacter = () => {
    setShowCharacter(true);
  };

  return (
    <div>
      <h1 className="text-6xl! mb-10!">Хто я?</h1>

      {/* ── Lobby ─────────────────────────────────────────────────────── */}
      {live.phase === "lobby" && (
        <Lobby
          code={live.code}
          joinUrl={joinUrl}
          players={state.players}
          onStart={() => startGame(room!.id)}
        />
      )}

      {/* ── Playing ───────────────────────────────────────────────────── */}
      {live.phase === "playing" && character && (
        <div className="text-center">
          <Modal
            isOpen={showCharacter}
            title="Загаданий персонаж:"
            onClose={() => setShowCharacter(false)}
          >
            <h2 className="text-[100px] font-bold">{character.character}</h2>
          </Modal>

          <button
            className="text-xl font-bold fixed top-[50px] right-[50px]"
            onClick={revealCharacter}
          >
            Показати персонажа
          </button>

          <p className="text-3xl text-white/60 mb-8">
            Персонаж {charIndex + 1} з {characters.length}
          </p>

          <ol className="text-5xl flex flex-col gap-6 max-w-4xl mx-auto mb-12 text-left">
            {character.hints.slice(0, revealed).map((hint, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-white/40 shrink-0">{i + 1}.</span>
                <span>{hint}</span>
              </li>
            ))}
          </ol>

          {/* Who pressed the buzzer — first one big, the rest in press order. */}
          <div className="min-h-[8rem] mb-12">
            {buzzes.length === 0 ? (
              <p className="text-4xl text-white/40">Ще ніхто не натиснув…</p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-7xl font-bold text-green-400">
                  {buzzes[0].name}
                </p>
                {buzzes.length > 1 && (
                  <p className="text-3xl text-white/60">
                    далі:{" "}
                    {buzzes
                      .slice(1)
                      .map((b) => b.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-6 justify-center flex-wrap fixed bottom-[25px] left-[25px]">
            <button
              className="text-xl! font-bold!"
              disabled={revealed >= HINTS_PER_CHARACTER}
              onClick={() => revealNextHint(room!.id, qIndex)}
            >
              Наступна підказка
            </button>
            {hasNext ? (
              <button className="text-xl! font-bold!" onClick={next}>
                Перейти до наступного персонажа
              </button>
            ) : (
              <span className="text-xl self-center text-white/60">
                Останній персонаж
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
