import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Answer, Player, Room, Vote } from "../types";

export interface RoomState {
  room: Room | null;
  players: Player[];
  answers: Answer[];
  votes: Vote[];
  ready: boolean;
}

type Row = { id: string };

/** Upsert/replace a row in a list keyed by id; removes on DELETE. */
function applyChange<T extends Row>(
  list: T[],
  eventType: string,
  row: T,
  old: Partial<T>,
): T[] {
  if (eventType === "DELETE") {
    return list.filter((r) => r.id !== (old.id ?? row.id));
  }
  const idx = list.findIndex((r) => r.id === row.id);
  if (idx === -1) return [...list, row];
  const next = [...list];
  next[idx] = row;
  return next;
}

/**
 * Subscribe to a room and all of its players/answers/votes in realtime.
 * Pass the room id (null until known) — the screen creates the room, phones
 * resolve it from the join code first.
 */
export function useRoomState(roomId: string | null): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    answers: [],
    votes: [],
    ready: false,
  });

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    // Initial snapshot.
    void (async () => {
      const [room, players, answers, votes] = await Promise.all([
        supabase.from("rooms").select().eq("id", roomId).maybeSingle(),
        supabase.from("players").select().eq("room_id", roomId),
        supabase.from("answers").select().eq("room_id", roomId),
        supabase.from("votes").select().eq("room_id", roomId),
      ]);
      if (cancelled) return;
      setState({
        room: (room.data as Room) ?? null,
        players: (players.data as Player[]) ?? [],
        answers: (answers.data as Answer[]) ?? [],
        votes: (votes.data as Vote[]) ?? [],
        ready: true,
      });
    })();

    const filter = `room_id=eq.${roomId}`;
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (p) =>
          setState((s) => ({
            ...s,
            room: p.eventType === "DELETE" ? null : (p.new as Room),
          })),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter },
        (p) =>
          setState((s) => ({
            ...s,
            players: applyChange(s.players, p.eventType, p.new as Player, p.old as Player),
          })),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers", filter },
        (p) =>
          setState((s) => ({
            ...s,
            answers: applyChange(s.answers, p.eventType, p.new as Answer, p.old as Answer),
          })),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter },
        (p) =>
          setState((s) => ({
            ...s,
            votes: applyChange(s.votes, p.eventType, p.new as Vote, p.old as Vote),
          })),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return state;
}
