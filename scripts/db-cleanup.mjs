#!/usr/bin/env node
/**
 * Cleans up stale "Варіанти" game state in Supabase.
 *
 * Deleting a room cascades to its players / answers / votes, so this only
 * needs to delete rooms. Credentials are read from the environment or, if
 * absent there, from `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 *
 * Usage:
 *   node scripts/db-cleanup.mjs                 # delete rooms older than 12h
 *   node scripts/db-cleanup.mjs --older-than=2  # delete rooms older than 2h
 *   node scripts/db-cleanup.mjs --all           # delete ALL rooms
 *   node scripts/db-cleanup.mjs --dry-run       # show what would be deleted
 *
 * Or via npm: `npm run db:cleanup -- --all`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = { ...process.env };
  const file = path.join(root, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = loadEnv();
const URL = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = env.VITE_SUPABASE_ANON_KEY || "";
if (!URL || !KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (env or .env.local).",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const dryRun = has("--dry-run");
const all = has("--all");
const olderThanArg = args.find((a) => a.startsWith("--older-than="));
const hours = olderThanArg ? Number(olderThanArg.split("=")[1]) : 12;

if (!all && (!Number.isFinite(hours) || hours < 0)) {
  console.error("--older-than must be a non-negative number of hours.");
  process.exit(1);
}

// PostgREST refuses an unfiltered DELETE, so "all" still needs a filter.
let filter, describe;
if (all) {
  filter = "id=not.is.null";
  describe = "ALL rooms";
} else {
  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString();
  filter = `created_at=lt.${encodeURIComponent(cutoff)}`;
  describe = `rooms older than ${hours}h (before ${cutoff})`;
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function api(method, query, prefer) {
  const res = await fetch(`${URL}/rest/v1/rooms?${query}`, {
    method,
    headers: prefer ? { ...headers, Prefer: prefer } : headers,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

try {
  const matched = await api("GET", `${filter}&select=id`);
  console.log(`Matched ${matched.length} ${describe}.`);

  if (dryRun) {
    console.log("Dry run — nothing deleted.");
    process.exit(0);
  }
  if (matched.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  const deleted = await api("DELETE", filter, "return=representation");
  console.log(
    `Deleted ${deleted.length} room(s); their players, answers and votes were removed by cascade.`,
  );
} catch (e) {
  console.error("Cleanup failed:", e.message);
  process.exit(1);
}
