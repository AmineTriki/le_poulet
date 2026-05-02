export const dynamic = 'force-dynamic';
"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { loadSession } from "@hooks/useGameSession";
import { useGameSocket } from "@hooks/useGameSocket";
import type { WsMessage } from "@hooks/useGameSocket";
import type { PlayerMarker, CircleState } from "@components/LeafletMap";

const LeafletMap = dynamic(() => import("@components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-poulet-black flex items-center justify-center">
      <div className="font-mono text-poulet-gold animate-pulse">Loading map…</div>
    </div>
  ),
});

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  found_order: number | null;
  chaos_points: number;
}

interface Challenge {
  id: string;
  title_en: string;
  title_fr: string;
  desc_en: string;
  desc_fr: string;
  points: number;
  time_limit_sec: number;
  category: string;
}

interface GameState {
  id: string;
  status: string;
  bar_lat: number | null;
  bar_lng: number | null;
  bar_name: string | null;
  head_start_ends_at: string | null;
  game_ends_at: string | null;
  language: string;
  chaos_mode: boolean;
}

function useTimer(targetIso: string | null): string {
  const [display, setDisplay] = useState("--:--");
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) { setDisplay("00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setDisplay(h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return display;
}

export default function HuntPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const session = typeof window !== "undefined" ? loadSession() : null;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerMarker[]>([]);
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [challengeDone, setChallengeDone] = useState(false);
  const myTeamId = useRef<string | null>(null);

  const isHeadStart = gameState?.status === "head_start";
  const timerTarget = isHeadStart ? gameState?.head_start_ends_at : gameState?.game_ends_at;
  const timer = useTimer(timerTarget ?? null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Fetch initial game state
  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch(`${API}/api/v1/games/${code}/state`);
      if (!res.ok) return;
      const data = await res.json() as {
        game: GameState;
        players: Array<{ id: string; last_lat: number | null; last_lng: number | null; emoji: string; name: string; team_id: string | null }>;
        teams: Team[];
        circle: { center_lat: number; center_lng: number; radius_m: number } | null;
      };
      setGameState(data.game);
      setTeams([...data.teams].sort((a, b) => b.score - a.score));

      // Figure out my team
      const me = data.players.find((p) => p.id === session?.playerId);
      myTeamId.current = me?.team_id ?? null;

      // Build player markers
      const myTeam = data.teams.find((t) => t.id === myTeamId.current);
      setPlayers(
        data.players
          .filter((p) => p.last_lat !== null && p.last_lng !== null)
          .map((p) => ({
            id: p.id,
            lat: p.last_lat!,
            lng: p.last_lng!,
            emoji: p.emoji,
            name: p.name,
            isMe: p.id === session?.playerId,
            color: data.teams.find((t) => t.id === p.team_id)?.color ?? undefined,
          })),
      );

      if (data.circle) {
        setCircle({ lat: data.circle.center_lat, lng: data.circle.center_lng, radiusM: data.circle.radius_m });
      }

      // Fetch challenge if active
      if (data.game.status === "active" && myTeamId.current) {
        void fetchChallenge(data.game.id, myTeamId.current, data.game.language);
      }
    };
    void fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchChallenge = async (gameId: string, teamId: string, lang = "en") => {
    const city = gameState?.bar_lng !== undefined ? "montreal" : "montreal";
    const res = await fetch(`${API}/api/v1/challenges/random/${gameId}/${teamId}?city=${city}`);
    if (res.ok) {
      setChallenge(await res.json() as Challenge);
      setChallengeDone(false);
    } else {
      setChallenge(null);
    }
  };

  const submitChallenge = async () => {
    if (!challenge || !session || !myTeamId.current || !gameState) return;
    setChallengeSubmitting(true);
    await fetch(`${API}/api/v1/challenges/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameState.id,
        challenge_id: challenge.id,
        team_id: myTeamId.current,
        player_token: session.playerToken,
        media_url: "",
      }),
    });
    setChallengeSubmitting(false);
    setChallengeDone(true);
    // Fetch next challenge after 2s
    setTimeout(() => void fetchChallenge(gameState.id, myTeamId.current!, gameState.language), 2000);
  };

  // Fetch scores every 15s
  useEffect(() => {
    if (!gameState?.id) return;
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/v1/teams/${gameState.id}/all`).catch(() => null);
      if (res?.ok) {
        const t = await res.json() as Team[];
        setTeams([...t].sort((a, b) => b.score - a.score));
      }
    }, 15_000);
    return () => clearInterval(poll);
  }, [API, gameState?.id]);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "location:update") {
      setPlayers((prev) => {
        const idx = prev.findIndex((p) => p.id === msg.player_id);
        const updated = { lat: msg.lat as number, lng: msg.lng as number };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx]!, ...updated };
          return next;
        }
        return prev;
      });
    } else if (msg.type === "circle:shrink") {
      setCircle({ lat: msg.lat as number, lng: msg.lng as number, radiusM: msg.radius_m as number });
    } else if (msg.type === "game:ended") {
      router.push(`/results/${code}`);
    } else if (msg.type === "game:started") {
      // Transition from head_start → active
      setGameState((prev) => prev ? { ...prev, status: "active" } : prev);
      if (gameState?.id && myTeamId.current) {
        void fetchChallenge(gameState.id, myTeamId.current, gameState.language);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, router, gameState?.id]);

  useGameSocket(gameState?.id ?? null, session?.playerId ?? null, handleWsMessage);

  const lang = gameState?.language ?? "en";

  return (
    <div className="h-screen bg-poulet-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-poulet-feather/20 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="font-heading text-poulet-gold text-2xl">HUNT</div>
          <div className="font-mono text-poulet-feather text-sm border border-poulet-feather/30 px-2 py-0.5">
            {code}
          </div>
          {isHeadStart && (
            <div className="font-mono text-poulet-cream text-xs border border-poulet-cream/30 px-2 py-0.5 animate-pulse">
              HEAD START
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xl text-poulet-gold tabular-nums">{timer}</div>
          <button
            onClick={() => setShowSidebar((s) => !s)}
            className="font-mono text-poulet-feather text-xs border border-poulet-feather/30 px-2 py-1 hover:border-poulet-gold hover:text-poulet-gold transition-colors"
          >
            {showSidebar ? "Map" : "Scores"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className={`relative transition-all duration-300 ${showSidebar ? "hidden md:block md:flex-1" : "flex-1"}`}>
          <LeafletMap
            isChicken={false}
            players={players}
            circle={circle}
            barLat={gameState?.bar_lat ?? undefined}
            barLng={gameState?.bar_lng ?? undefined}
            playerToken={session?.playerToken}
          />

          {/* My team score overlay */}
          {myTeamId.current && (() => {
            const myTeam = teams.find((t) => t.id === myTeamId.current);
            return myTeam ? (
              <div className="absolute bottom-4 left-4 z-[1000] bg-poulet-black/90 border px-3 py-2" style={{ borderColor: myTeam.color }}>
                <div className="font-mono text-xs text-poulet-feather uppercase">{myTeam.name}</div>
                <div className="font-heading text-2xl" style={{ color: myTeam.color }}>
                  {myTeam.score.toLocaleString()} pts
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Sidebar: Leaderboard */}
        {showSidebar && (
          <div className="w-full md:w-72 flex flex-col border-l border-poulet-feather/20 overflow-y-auto">
            <div className="p-4 border-b border-poulet-feather/20">
              <div className="font-heading text-poulet-gold text-xl uppercase">Leaderboard</div>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {teams.map((team, i) => (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 p-3 border transition-colors ${
                    team.id === myTeamId.current ? "border-poulet-gold bg-poulet-gold/5" : "border-poulet-feather/20"
                  }`}
                >
                  <span className="font-mono text-poulet-gold w-5 text-sm">#{i + 1}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-poulet-cream text-sm truncate">{team.name}</div>
                    {team.found_order && (
                      <div className="font-mono text-poulet-gold text-xs">Found #{team.found_order}</div>
                    )}
                  </div>
                  <div className="font-mono text-sm" style={{ color: team.color }}>
                    {team.score.toLocaleString()}
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="font-mono text-poulet-feather text-xs text-center py-8">No teams yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Challenge panel */}
      {!isHeadStart && (
        <div className="border-t border-poulet-feather/20 bg-poulet-black flex-shrink-0" style={{ minHeight: "10rem" }}>
          {challenge ? (
            <div className="px-4 py-3 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-poulet-gold text-xs uppercase border border-poulet-gold/40 px-1.5 py-0.5">
                    {challenge.category}
                  </span>
                  <span className="font-mono text-poulet-gold text-xs">+{challenge.points}pts</span>
                </div>
                <div className="font-heading text-poulet-cream text-lg leading-tight">
                  {lang === "fr" ? challenge.title_fr : challenge.title_en}
                </div>
                <div className="font-body text-poulet-feather text-sm mt-1 italic">
                  {lang === "fr" ? challenge.desc_fr : challenge.desc_en}
                </div>
              </div>
              <div className="flex-shrink-0">
                {challengeDone ? (
                  <div className="font-mono text-poulet-gold text-sm text-center">
                    ✓ Done!<br />
                    <span className="text-poulet-feather text-xs">Next coming…</span>
                  </div>
                ) : (
                  <button
                    onClick={() => void submitChallenge()}
                    disabled={challengeSubmitting}
                    className="bg-poulet-gold text-poulet-black font-heading text-sm px-4 py-3 uppercase hover:brightness-110 disabled:opacity-50 transition-all whitespace-nowrap"
                  >
                    {challengeSubmitting ? "…" : "Done! ✓"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-center font-body text-poulet-feather italic text-sm">
              {isHeadStart ? "Challenges start when the hunt begins…" : "No more challenges 🎉"}
            </div>
          )}
        </div>
      )}

      {isHeadStart && (
        <div className="border-t border-poulet-feather/20 bg-poulet-black/80 px-4 py-4 text-center flex-shrink-0">
          <div className="font-mono text-poulet-feather text-xs uppercase mb-1">Head start — chicken is hiding</div>
          <div className="font-heading text-poulet-gold text-3xl tabular-nums">{timer}</div>
          <div className="font-mono text-poulet-feather text-xs mt-1">until hunt begins</div>
        </div>
      )}
    </div>
  );
}
