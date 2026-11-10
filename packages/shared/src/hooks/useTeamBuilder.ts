"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import type { Player } from "../types/player";

export interface Team {
  id: string;
  name: string;
  color: string;
  players: Player[];
}

export function useTeamBuilder(players: Player[], teamSize: number) {
  const [phase, setPhase] = useState<"idle" | "chicken" | "teams" | "done">("idle");
  const [chicken, setChicken] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reveal timer on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pickChicken = useCallback(() => {
    setPhase("chicken");
    const idx = Math.floor(Math.random() * players.length);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setChicken(players[idx] ?? null);
      setPhase("teams");
    }, 3000);
  }, [players]);

  const buildTeams = useCallback(() => {
    const hunters = players.filter((p) => p.id !== chicken?.id);
    // Fisher-Yates (Array.sort with a random comparator is biased).
    const shuffled = [...hunters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    const size = Math.max(1, Math.floor(teamSize)); // guard: size <= 0 would loop forever
    const result: Team[] = [];
    for (let i = 0; i < shuffled.length; i += size) {
      result.push({
        id: `team-${i}`,
        name: `Team ${result.length + 1}`,
        color: "#F5C518",
        players: shuffled.slice(i, i + size),
      });
    }
    setTeams(result);
    setPhase("done");
  }, [players, chicken, teamSize]);

  return { phase, chicken, teams, pickChicken, buildTeams };
}
