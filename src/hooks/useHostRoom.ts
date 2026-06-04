import { useEffect, useRef, useState } from "react";
import type { Room } from "../types";
import { createRoom } from "../lib/variants";
import { useRoomState, type RoomState } from "./useRoomState";

export interface HostRoom {
  /** The room as first created (id is stable once set). */
  room: Room | null;
  /** The latest room, preferring the realtime copy over the created one. */
  live: Room | null;
  /** Realtime players/answers/votes for the room. */
  state: RoomState;
}

/**
 * Host-side room lifecycle shared by every activity that hands out a join code:
 * create exactly one room (guarded against StrictMode's double-invoke) and
 * subscribe to it in realtime.
 */
export function useHostRoom(): HostRoom {
  const [room, setRoom] = useState<Room | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void createRoom().then(setRoom);
  }, []);

  const state = useRoomState(room?.id ?? null);
  return { room, live: state.room ?? room, state };
}
