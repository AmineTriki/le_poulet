"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@components/LeafletMap"), { ssr: false });

export default function ChickenPage() {
  const { code } = useParams<{ code: string }>();
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const isDanger = nearestDistance !== null && nearestDistance < 200;

  return (
    <div className="h-screen bg-poulet-black flex flex-col">
      <div className={`h-14 border-b flex items-center justify-between px-6 flex-shrink-0 transition-all ${isDanger ? "border-poulet-red bg-poulet-red/10" : "border-poulet-feather/20"}`}>
        <div className="font-heading text-poulet-red text-xl uppercase">
          {isDanger ? "⚠️ TEAM NEARBY — STAY HIDDEN" : "🐔 YOU ARE THE CHICKEN"}
        </div>
        <div className="font-mono text-poulet-feather text-sm">{code}</div>
      </div>
      {nearestDistance !== null && (
        <div className="px-6 py-2 border-b border-poulet-feather/20 flex items-center gap-4 flex-shrink-0">
          <span className="font-mono text-poulet-feather text-xs uppercase">Nearest team</span>
          <span className={`font-mono text-lg font-bold ${isDanger ? "text-poulet-red" : "text-poulet-gold"}`}>
            {nearestDistance < 1000 ? `${Math.round(nearestDistance)}m` : `${(nearestDistance / 1000).toFixed(1)}km`}
          </span>
          {isDanger && <span className="animate-pulse text-poulet-red text-xs font-mono">● DANGER</span>}
        </div>
      )}
      <div className="flex-1 relative overflow-hidden">
        <LeafletMap gameCode={code ?? ""} isChicken />
      </div>
    </div>
  );
}
