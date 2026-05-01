import React from "react";
import type { WeaponType } from "@le-poulet/shared";

interface WeaponCardProps {
  weapon: WeaponType;
  cost: number;
  description: string;
  name: string;
  emoji: string;
  canAfford: boolean;
  onFire?: () => void;
  cooldownSeconds?: number;
}

export function WeaponCard({ weapon, cost, description, name, emoji, canAfford, onFire, cooldownSeconds }: WeaponCardProps) {
  const onCooldown = (cooldownSeconds ?? 0) > 0;
  return (
    <div className="border border-poulet-feather/30 bg-poulet-black p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <div className="font-heading text-poulet-gold uppercase">{name}</div>
          <div className="font-body text-poulet-feather text-xs">{description}</div>
        </div>
        <div className="font-mono text-poulet-gold text-sm">{cost}pts</div>
      </div>
      <button
        onClick={onFire}
        disabled={!canAfford || onCooldown}
        className="w-full py-2 text-sm font-mono uppercase bg-poulet-red text-white disabled:opacity-40 hover:brightness-110 transition-all"
      >
        {onCooldown ? `${cooldownSeconds}s` : "FIRE"}
      </button>
    </div>
  );
}
