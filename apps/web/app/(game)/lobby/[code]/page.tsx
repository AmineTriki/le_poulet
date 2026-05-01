"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const RouletteWheel = dynamic(() => import("@components/RouletteWheel").then((m) => ({ default: m.RouletteWheel })), { ssr: false });

interface Player { id: string; name: string; emoji: string; role: string; }

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameName, setGameName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${code}` : "";

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const fetchData = async () => {
      const gameRes = await fetch(`${API}/api/v1/games/${code}`);
      if (!gameRes.ok) return;
      const g = await gameRes.json() as { id: string; name: string };
      setGameId(g.id);
      setGameName(g.name);
      const playersRes = await fetch(`${API}/api/v1/players/${g.id}/all`);
      if (playersRes.ok) setPlayers(await playersRes.json() as Player[]);
    };
    void fetchData();
    const interval = setInterval(() => void fetchData(), 3000);
    return () => clearInterval(interval);
  }, [code]);

  const copyLink = () => {
    void navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showRoulette) {
    return (
      <div className="min-h-screen bg-poulet-black flex flex-col items-center justify-center px-6 py-12">
        <h2 className="font-heading text-poulet-gold text-5xl uppercase mb-8">Who Is The Chicken?</h2>
        <RouletteWheel
          players={players.map((p) => ({ name: p.name, emoji: p.emoji }))}
          onResult={(p) => setWinner({ id: "", name: p.name, emoji: p.emoji, role: "chicken" })}
        />
        {winner && (
          <div className="mt-8 text-center">
            <div className="font-heading text-poulet-gold text-4xl uppercase">
              {winner.emoji} {winner.name} is the Chicken!
            </div>
            <button
              onClick={() => window.location.href = `/hunt/${code}`}
              className="mt-6 bg-poulet-gold text-poulet-black font-heading text-2xl px-10 py-4 uppercase hover:brightness-110 transition-all"
            >
              START THE HUNT 🐔
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-poulet-black px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="font-mono text-poulet-feather text-sm uppercase mb-2">{gameName}</div>
          <div className="font-heading text-poulet-gold" style={{ fontSize: "6rem", lineHeight: 1 }}>{code}</div>
          <div className="font-mono text-poulet-feather text-xs mt-2">Share this code</div>
        </div>

        <div className="flex gap-3">
          <button onClick={copyLink} className="flex-1 border border-poulet-gold text-poulet-gold font-mono text-sm py-3 hover:bg-poulet-gold hover:text-poulet-black transition-all">
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="font-heading text-poulet-gold text-2xl uppercase">Players</div>
            <div className="font-mono text-poulet-feather text-sm">{players.length} joined</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border border-poulet-feather/30 px-4 py-3">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <div className="font-body text-poulet-cream">{p.name}</div>
                  {p.role === "host" && <div className="font-mono text-poulet-gold text-xs">Host</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {players.length >= 2 && (
          <button
            onClick={() => setShowRoulette(true)}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-2xl py-4 uppercase hover:brightness-110 transition-all shadow-gold"
          >
            SPIN THE ROULETTE 🎡
          </button>
        )}
        {players.length < 2 && (
          <div className="border border-poulet-feather/20 p-6 text-center font-body text-poulet-feather italic">
            Waiting for more players to join...
          </div>
        )}
      </div>
    </div>
  );
}
