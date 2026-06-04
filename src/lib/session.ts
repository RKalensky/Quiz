/**
 * A phone's identity within one room, persisted in localStorage so a refresh
 * (or scanning the QR again) rejoins the same player instead of duplicating.
 * Namespaced per activity ("variants", "whoami") since rooms are independent.
 */
export interface Session {
  roomId: string;
  playerId: string;
  name: string;
}

function key(namespace: string, code: string): string {
  return `${namespace}:${code.toUpperCase()}`;
}

export function loadSession(namespace: string, code: string): Session | null {
  const raw = localStorage.getItem(key(namespace, code));
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function saveSession(
  namespace: string,
  code: string,
  session: Session,
): void {
  localStorage.setItem(key(namespace, code), JSON.stringify(session));
}
