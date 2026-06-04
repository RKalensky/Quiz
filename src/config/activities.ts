import game from "./game.json";

/** One selectable activity, backed by a key in game.json. */
export interface ActivityMeta {
  /** Key in game.json holding this activity's data. */
  key: string;
  /** Route path. */
  path: string;
  /** Label shown on the home screen. */
  label: string;
}

export const ACTIVITIES: ActivityMeta[] = [
  { key: "stump", path: "/stump", label: "Підстава" },
  { key: "fiveTen", path: "/five-ten", label: "П'яте-десяте" },
  { key: "FourForForty", path: "/four-for-forty", label: "Чотири за сорок" },
  { key: "variants", path: "/variants", label: "Варіанти" },
  { key: "whoami", path: "/whoami", label: "Хто я?" },
];

/**
 * Returns the activity's data if game.json has a non-empty array under `key`,
 * otherwise null. Indexed loosely so a key can be removed from game.json
 * entirely without breaking the build.
 */
export function getActivityData<T>(key: string): T | null {
  const data = (game as Record<string, unknown>)[key];
  return Array.isArray(data) && data.length > 0 ? (data as T) : null;
}

/** Whether the activity has data and should be offered to players. */
export function hasActivityData(key: string): boolean {
  return getActivityData(key) !== null;
}
