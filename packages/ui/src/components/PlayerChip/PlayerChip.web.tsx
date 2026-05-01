import React from "react";
import type { Player } from "@le-poulet/shared";

interface PlayerChipProps {
  player: Player;
  showScore?: boolean;
}

export function PlayerChip({ player, showScore = false }: PlayerChipProps) {
  return (
    <div className="flex items-center gap-2 bg-poulet-black border border-poulet-feather/30 px-3 py-2">
      <span className="text-xl">{player.emoji}</span>
      <span className="font-body text-poulet-cream text-sm">{player.name}</span>
      {showScore && <span className="font-mono text-poulet-gold text-xs ml-auto">{player.score}pts</span>}
    </div>
  );
}
