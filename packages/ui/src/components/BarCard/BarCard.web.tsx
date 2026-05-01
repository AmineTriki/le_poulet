import React from "react";
import type { Bar } from "@le-poulet/shared";
import { formatDistance } from "@le-poulet/shared";

interface BarCardProps {
  bar: Bar;
  onSelect?: (bar: Bar) => void;
  selected?: boolean;
}

export function BarCard({ bar, onSelect, selected = false }: BarCardProps) {
  return (
    <button
      onClick={() => onSelect?.(bar)}
      className={[
        "w-full text-left border p-4 transition-all hover:border-poulet-gold",
        selected ? "border-poulet-gold bg-poulet-gold/10 shadow-gold" : "border-poulet-feather/30 bg-poulet-black",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-heading text-poulet-gold text-lg uppercase">{bar.name}</div>
          {bar.address && (
            <div className="font-body text-poulet-feather text-sm mt-1">
              {bar.houseNumber} {bar.address}
            </div>
          )}
        </div>
        {bar.distanceM !== undefined && (
          <div className="font-mono text-poulet-cream text-sm flex-shrink-0">
            {formatDistance(bar.distanceM)}
          </div>
        )}
      </div>
    </button>
  );
}
