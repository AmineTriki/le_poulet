"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (code.length !== 6 || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const gameRes = await fetch(`${API}/api/v1/games/${code}`);
      if (!gameRes.ok) { setError("Game not found. Check your code."); setLoading(false); return; }
      const game = await gameRes.json() as { id: string };
      await fetch(`${API}/api/v1/players/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: game.id, name: name.trim() }),
      });
      router.push(`/lobby/${code}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-poulet-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🐔</div>
          <h1 className="font-heading text-poulet-gold text-5xl uppercase">Join Hunt</h1>
          <p className="font-body text-poulet-feather mt-2 italic">Enter your 6-letter game code</p>
        </div>
        <div className="space-y-4">
          <input
            className="w-full text-center bg-transparent border-2 border-poulet-gold text-poulet-gold font-mono text-4xl py-4 uppercase tracking-widest focus:outline-none transition-all"
            placeholder="XXXXXX"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <input
            className="w-full bg-transparent border border-poulet-feather/40 text-poulet-cream font-body px-4 py-3 focus:outline-none focus:border-poulet-gold transition-colors"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleJoin()}
          />
          {error && <div className="font-mono text-poulet-red text-sm text-center">{error}</div>}
          <button
            onClick={() => void handleJoin()}
            disabled={loading || code.length !== 6 || !name.trim()}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-2xl py-4 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold disabled:opacity-40"
          >
            {loading ? "Joining..." : "JOIN THE HUNT →"}
          </button>
        </div>
      </div>
    </div>
  );
}
