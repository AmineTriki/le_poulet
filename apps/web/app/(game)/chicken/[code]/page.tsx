"use client";
import React, { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { loadSession } from "@hooks/useGameSession";
import { useGameSocket } from "@hooks/useGameSocket";
import type { WsMessage } from "@hooks/useGameSocket";

const LeafletMap = dynamic(() => import("@components/LeafletMap"), { ssr: false });

export default function ChickenPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const session = typeof window !== "undefined" ? loadSession() : null;

  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const isDanger = nearestDistance !== null && nearestDistance < 200;

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "chicken:alert") {
      setNearestDistance(msg.distance_m as number);
      setAlertCount((n) => n + 1);
    } else if (msg.type === "game:ended") {
      router.push(`/results/${code}`);
    }
  }, [code, router]);

  const { status: wsStatus } = useGameSocket(session?.gameId ?? null, session?.playerId ?? null, handleWsMessage);

  return (
    <div className="h-dvh bg-poulet-black flex flex-col pt-safe">
      {/* Header */}
      <div
        className={`h-14 border-b flex items-center justify-between px-4 gap-2 flex-shrink-0 transition-all duration-500 ${
          isDanger ? "border-poulet-red bg-poulet-red/10" : "border-poulet-feather/20"
        }`}
      >
        <div className={`font-heading text-xl uppercase transition-colors ${isDanger ? "text-poulet-red" : "text-poulet-cream"}`}>
          {isDanger ? "⚠️ TEAM NEARBY — STAY HIDDEN" : "🐔 YOU ARE THE CHICKEN"}
        </div>
        <div className="font-mono text-poulet-feather text-sm">{code}</div>
      </div>

      {wsStatus !== "open" && (
        <div role="status" className="bg-poulet-red/20 border-b border-poulet-red/50 px-4 py-1 text-center font-mono text-xs text-poulet-cream flex-shrink-0">
          {wsStatus === "connecting" ? "Connecting to game…" : "Connection lost — reconnecting…"}
        </div>
      )}

      {/* Proximity alert bar */}
      {nearestDistance !== null && (
        <div
          role="alert"
          className={`px-4 py-2 border-b flex items-center gap-4 flex-shrink-0 transition-colors ${
            isDanger ? "border-poulet-red/40 bg-poulet-red/5" : "border-poulet-feather/20"
          }`}
        >
          <span className="font-mono text-poulet-feather text-xs uppercase">Nearest team</span>
          <span className={`font-mono text-lg font-bold tabular-nums ${isDanger ? "text-poulet-red" : "text-poulet-gold"}`}>
            {nearestDistance < 1000
              ? `${Math.round(nearestDistance)}m`
              : `${(nearestDistance / 1000).toFixed(1)}km`}
          </span>
          {isDanger && (
            <span className="animate-pulse text-poulet-red text-xs font-mono">● DANGER</span>
          )}
          {alertCount > 0 && (
            <span className="ml-auto font-mono text-poulet-feather text-xs">
              {alertCount} alert{alertCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Map — chicken's GPS is reported but their position is NOT shown to hunters */}
      <div className="flex-1 relative overflow-hidden pb-safe">
        <LeafletMap
          isChicken
          playerToken={session?.playerToken}
        />
      </div>
    </div>
  );
}
