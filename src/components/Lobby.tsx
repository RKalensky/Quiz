import { QRCodeSVG } from "qrcode.react";
import type { Player } from "../types";
import { isLocalhostUrl } from "../lib/baseUrl";

/**
 * The pre-game lobby every host activity shows: the join code, its QR, the
 * roster of players who have joined, and the "start" button.
 */
export default function Lobby({
  code,
  joinUrl,
  players,
  onStart,
}: {
  code: string;
  joinUrl: string;
  players: Player[];
  onStart: () => void;
}) {
  return (
    <div className="text-center">
      <p className="text-4xl mb-6">Зайди з телефону та скануй QR:</p>
      <p className="text-9xl font-bold tracking-widest mb-8">{code}</p>
      <div className="inline-block bg-white p-4 rounded-lg mb-10">
        <QRCodeSVG value={joinUrl} size={260} />
      </div>
      {isLocalhostUrl(joinUrl) && (
        <p className="text-2xl text-red-400 mb-6 max-w-2xl mx-auto">
          ⚠ QR вказує на localhost — телефони його не відкриють. Відкрий цей екран
          через Network-URL (напр. http://192.168.x.x:5173) або задай
          VITE_PUBLIC_BASE_URL.
        </p>
      )}
      <p className="text-3xl mb-6">
        Гравців: <strong>{players.length}</strong>
      </p>
      <div className="flex flex-wrap gap-3 justify-center mb-10 text-2xl">
        {players.map((p) => (
          <span key={p.id} className="border border-white rounded-lg px-4 py-2">
            {p.name}
          </span>
        ))}
      </div>
      <button
        className="text-4xl! font-bold!"
        disabled={players.length === 0}
        onClick={onStart}
      >
        Почати гру
      </button>
    </div>
  );
}
