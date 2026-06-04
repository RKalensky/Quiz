/**
 * The address phones should open, embedded into the join QR code. Phones can't
 * reach the host's `localhost`, so prefer VITE_PUBLIC_BASE_URL when set. The
 * value is forgiving: a bare host like "192.168.0.10" gets the current page's
 * protocol and port filled in (→ "http://192.168.0.10:5173").
 */
export function resolveBaseUrl(): string {
  const raw = (
    import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined
  )?.trim();
  if (!raw) return window.location.origin;
  const withScheme = /^https?:\/\//.test(raw)
    ? raw
    : `${window.location.protocol}//${raw}`;
  try {
    const u = new URL(withScheme);
    if (!u.port && window.location.port) u.port = window.location.port;
    return u.origin;
  } catch {
    return window.location.origin;
  }
}

/** True when the QR target points at localhost, which phones can't reach. */
export function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);
}
