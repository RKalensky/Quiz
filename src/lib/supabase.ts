import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily initialised so the rest of the app (and the other rounds) keep
// working even before Supabase env vars are configured. The error only
// surfaces when the "Варіанти" activity actually talks to Supabase.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `npm run dev`.",
    );
  }

  client = createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const resolved = getClient();
    const value = Reflect.get(resolved, prop);
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});
