import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { joinRoom } from "../lib/variants";
import { loadSession, saveSession, type Session } from "../lib/session";

/** The join screen: code (prefilled from the QR) + name. */
function JoinForm({
  title,
  onJoined,
}: {
  title: string;
  onJoined: (code: string, session: Session) => void;
}) {
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
      onJoined(room.code, {
        roomId: room.id,
        playerId: player.id,
        name: player.name,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося приєднатися");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-4xl! mb-8!">{title}</h1>
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

/**
 * Wraps a phone activity: shows the join form until the player has a session
 * (restored from localStorage or freshly joined), then renders the activity.
 */
export default function PhoneClient({
  title,
  namespace,
  children,
}: {
  title: string;
  namespace: string;
  children: (session: Session) => ReactNode;
}) {
  const [params] = useSearchParams();
  const urlCode = (params.get("code") ?? "").toUpperCase();
  const [session, setSession] = useState<Session | null>(() =>
    urlCode ? loadSession(namespace, urlCode) : null,
  );

  const onJoined = (code: string, s: Session) => {
    saveSession(namespace, code, s);
    setSession(s);
  };

  return session ? (
    <>{children(session)}</>
  ) : (
    <JoinForm title={title} onJoined={onJoined} />
  );
}
