"use client";
import { useState, useCallback } from "react";
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

  const pickChicken = useCallback(() => {
    setPhase("chicken");
    const idx = Math.floor(Math.random() * players.length);
    setTimeout(() => {
      setChicken(players[idx] ?? null);
      setPhase("teams");
    }, 3000);
  }, [players]);

  const buildTeams = useCallback(() => {
    const hunters = players.filter((p) => p.id !== chicken?.id);
    const shuffled = [...hunters].sort(() => Math.random() - 0.5);
    const result: Team[] = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      result.push({
        id: `team-${i}`,
        name: `Team ${result.length + 1}`,
        color: "#F5C518",
        players: shuffled.slice(i, i + teamSize),
      });
    }
    setTeams(result);
    setPhase("done");
  }, [players, chicken, teamSize]);

  return { phase, chicken, teams, pickChicken, buildTeams };
}
