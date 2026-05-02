export const dynamic = 'force-dynamic';
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { loadSession } from "@hooks/useGameSession";
import { useGameSocket } from "@hooks/useGameSocket";
import type { WsMessage } from "@hooks/useGameSocket";

const RouletteWheel = dynamic(
  () => import("@components/RouletteWheel").then((m) => ({ default: m.RouletteWheel })),
  { ssr: false },
);

interface Player {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

interface GameInfo {
  id: string;
  name: string;
  status: string;
  buy_in_amount: number;
  head_start_minutes: number;
  game_duration_hours: number;
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteDone, setRouletteDone] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const session = typeof window !== "undefined" ? loadSession() : null;
  const isHost = session?.isHost === true && session.gameCode === code;
  const gameId = game?.id ?? session?.gameId ?? null;
  const playerId = session?.playerId ?? null;

  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/join?code=${code}` : "";

  // Initial data fetch
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const fetchState = async () => {
      const res = await fetch(`${API}/api/v1/games/${code}`);
      if (!res.ok) return;
      const g = await res.json() as GameInfo;
      setGame(g);
      const pRes = await fetch(`${API}/api/v1/players/${g.id}/all`);
      if (pRes.ok) setPlayers(await pRes.json() as Player[]);
    };
    void fetchState();
  }, [code]);

  // Redirect to correct page if game already started
  const redirectByRole = useCallback(async () => {
    if (!session?.playerToken) { router.push(`/hunt/${code}`); return; }
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const res = await fetch(`${API}/api/v1/players/me/${session.playerToken}`);
      if (!res.ok) { router.push(`/hunt/${code}`); return; }
      const p = await res.json() as { role: string };
      router.push(p.role === "chicken" ? `/chicken/${code}` : `/hunt/${code}`);
    } catch {
      router.push(`/hunt/${code}`);
    }
  }, [code, router, session?.playerToken]);

  // WebSocket handler
  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "player:joined") {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === msg.player_id);
        if (exists) return prev;
        return [...prev, {
          id: msg.player_id as string,
          name: msg.name as string,
          emoji: msg.emoji as string,
          role: "hunter",
        }];
      });
    } else if (msg.type === "player:left") {
      setPlayers((prev) => prev.filter((p) => p.id !== msg.player_id));
    } else if (msg.type === "game:started") {
      void redirectByRole();
    }
  }, [redirectByRole]);

  useGameSocket(gameId, playerId, handleWsMessage);

  const copyLink = () => {
    void navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!isHost || !session?.hostToken || !code) return;
    setStarting(true);
    setStartError("");
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const res = await fetch(`${API}/api/v1/games/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_token: session.hostToken }),
      });
      if (!res.ok) {
        setStartError("Failed to start. Are you the host?");
        setStarting(false);
      }
      // WS will deliver game:started → redirect happens there
    } catch {
      setStartError("Network error. Try again.");
      setStarting(false);
    }
  };

  if (showRoulette) {
    return (
      <div className="min-h-screen bg-poulet-black flex flex-col items-center justify-center px-6 py-12">
        <h2 className="font-heading text-poulet-gold text-5xl uppercase mb-8 text-center">
          Who Is The Chicken?
        </h2>
        <RouletteWheel
          players={players.map((p) => ({ name: p.name, emoji: p.emoji }))}
          onResult={() => setRouletteDone(true)}
        />
        {rouletteDone && isHost && (
          <div className="mt-8 text-center space-y-4">
            <p className="font-mono text-poulet-feather text-sm">
              The server will pick the actual chicken — this was just for drama. 🐔
            </p>
            {startError && (
              <div className="font-mono text-poulet-red text-sm">{startError}</div>
            )}
            <button
              onClick={() => void handleStartGame()}
              disabled={starting}
              className="bg-poulet-gold text-poulet-black font-heading text-2xl px-10 py-4 uppercase hover:brightness-110 transition-all disabled:opacity-50"
            >
              {starting ? "Starting..." : "START THE HUNT 🐔"}
            </button>
          </div>
        )}
        {rouletteDone && !isHost && (
          <p className="mt-8 font-mono text-poulet-feather text-sm text-center">
            Waiting for host to start the game…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-poulet-black px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Game code */}
        <div className="text-center">
          <div className="font-mono text-poulet-feather text-sm uppercase mb-2">
            {game?.name ?? "Loading…"}
          </div>
          <div
            className="font-heading text-poulet-gold"
            style={{ fontSize: "6rem", lineHeight: 1 }}
          >
            {code}
          </div>
          <div className="font-mono text-poulet-feather text-xs mt-2">Share this code</div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3">
          <button
            onClick={copyLink}
            className="flex-1 border border-poulet-gold text-poulet-gold font-mono text-sm py-3 hover:bg-poulet-gold hover:text-poulet-black transition-all"
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <button
            onClick={() => {
              const text = `Join my Le Poulet chicken hunt! Code: ${code} — ${joinUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
            }}
            className="border border-poulet-feather/40 text-poulet-feather font-mono text-sm px-4 py-3 hover:border-poulet-gold hover:text-poulet-gold transition-all"
          >
            WhatsApp
          </button>
        </div>

        {/* Player list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="font-heading text-poulet-gold text-2xl uppercase">Players</div>
            <div className="font-mono text-poulet-feather text-sm">{players.length} joined</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 border px-4 py-3 transition-colors ${
                  p.id === playerId
                    ? "border-poulet-gold bg-poulet-gold/10"
                    : "border-poulet-feather/30"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <div className="font-body text-poulet-cream">
                    {p.name}
                    {p.id === playerId && (
                      <span className="font-mono text-poulet-gold text-xs ml-2">(you)</span>
                    )}
                  </div>
                  {p.role === "host" && (
                    <div className="font-mono text-poulet-gold text-xs">Host</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game details */}
        {game && (
          <div className="border border-poulet-feather/20 p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-mono text-poulet-feather text-xs uppercase">Head Start</div>
              <div className="font-heading text-poulet-gold text-xl">{game.head_start_minutes}min</div>
            </div>
            <div>
              <div className="font-mono text-poulet-feather text-xs uppercase">Duration</div>
              <div className="font-heading text-poulet-gold text-xl">{game.game_duration_hours}h</div>
            </div>
            <div>
              <div className="font-mono text-poulet-feather text-xs uppercase">Buy-In</div>
              <div className="font-heading text-poulet-gold text-xl">
                {game.buy_in_amount === 0 ? "Free" : `$${game.buy_in_amount}`}
              </div>
            </div>
          </div>
        )}

        {/* Host CTA */}
        {isHost && players.length >= 2 && (
          <button
            onClick={() => setShowRoulette(true)}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-2xl py-4 uppercase hover:brightness-110 transition-all shadow-gold"
          >
            SPIN THE ROULETTE 🎡
          </button>
        )}
        {!isHost && (
          <div className="border border-poulet-feather/20 p-6 text-center font-body text-poulet-feather italic">
            Waiting for the host to spin the roulette…
          </div>
        )}
        {isHost && players.length < 2 && (
          <div className="border border-poulet-feather/20 p-6 text-center font-body text-poulet-feather italic">
            Waiting for more players to join…
          </div>
        )}
      </div>
    </div>
  );
}
