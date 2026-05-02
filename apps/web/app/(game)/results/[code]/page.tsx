export const dynamic = 'force-dynamic';
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Team { id: string; name: string; color: string; score: number; found_order: number | null; }

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${API}/api/v1/games/${code}`)
      .then((r) => r.json() as Promise<{ id: string }>)
      .then((g) => fetch(`${API}/api/v1/teams/${g.id}/all`))
      .then((r) => r.json() as Promise<Team[]>)
      .then((t) => { setTeams([...t].sort((a, b) => b.score - a.score)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code]);

  const winner = teams[0];

  return (
    <div className="min-h-screen bg-poulet-black px-6 py-20">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="font-heading text-poulet-gold leading-none mb-4" style={{ fontSize: "clamp(4rem, 15vw, 8rem)" }}>
            GAME<br />OVER
          </div>
          <div className="font-body text-poulet-feather italic">Here&apos;s what happened tonight</div>
        </div>

        {winner && !loading && (
          <div className="border-2 border-poulet-gold bg-poulet-gold/10 p-8 text-center shadow-gold">
            <div className="font-mono text-poulet-gold text-xs uppercase tracking-widest mb-2">Winner</div>
            <div className="font-heading text-poulet-gold text-5xl uppercase mb-2">{winner.name}</div>
            <div className="font-mono text-poulet-cream text-3xl">{winner.score.toLocaleString()} pts</div>
          </div>
        )}

        {loading && <div className="font-mono text-poulet-feather text-center animate-pulse">Loading scores...</div>}

        <div className="space-y-2">
          {teams.map((team, i) => (
            <div key={team.id} className="flex items-center gap-3 border border-poulet-feather/30 px-4 py-4 hover:border-poulet-feather/60 transition-colors">
              <span className="font-mono text-poulet-gold w-8 text-right text-lg">#{i + 1}</span>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
              <span className="font-body text-poulet-cream flex-1 text-lg">{team.name}</span>
              {team.found_order && (
                <span className="font-mono text-poulet-green text-xs border border-poulet-green/40 px-2 py-0.5">
                  Found #{team.found_order}
                </span>
              )}
              <span className="font-mono text-poulet-gold text-lg">{team.score.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {teams.length === 0 && !loading && (
          <div className="border border-poulet-feather/20 p-8 text-center font-body text-poulet-feather italic">
            No teams found for this game.
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/create" className="flex-1 bg-poulet-gold text-poulet-black font-heading text-xl py-4 text-center uppercase hover:brightness-110 transition-all">
            Play Again 🐔
          </Link>
          <Link href="/" className="border border-poulet-feather/40 text-poulet-feather font-mono px-6 py-4 hover:border-poulet-gold hover:text-poulet-gold transition-all">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
