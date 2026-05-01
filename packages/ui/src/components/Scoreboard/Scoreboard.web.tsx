import React from "react";
import { formatScore } from "@le-poulet/shared";

interface TeamScore {
  teamId: string;
  teamName: string;
  color: string;
  score: number;
  foundOrder: number | null;
}

interface ScoreboardProps {
  teams: TeamScore[];
}

export function Scoreboard({ teams }: ScoreboardProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-2">
      {sorted.map((team, i) => (
        <div key={team.teamId} className="flex items-center gap-3 border border-poulet-feather/30 px-4 py-3">
          <span className="font-mono text-poulet-gold w-6 text-right">#{i + 1}</span>
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
          <span className="font-body text-poulet-cream flex-1">{team.teamName}</span>
          {team.foundOrder && (
            <span className="text-xs text-poulet-green font-mono">Found #{team.foundOrder}</span>
          )}
          <span className="font-mono text-poulet-gold">{formatScore(team.score)}</span>
        </div>
      ))}
    </div>
  );
}
