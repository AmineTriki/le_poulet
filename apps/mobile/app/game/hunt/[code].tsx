import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, StatusBar, SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import NativeMap, { type PlayerMarker, type CircleState } from "@/components/NativeMap";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";
import { useGameSocket, type WsMessage } from "@/hooks/useGameSocket";
import { loadSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

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

interface GameInfo {
  id: string;
  status: string;
  language: string;
  bar_lat: number | null;
  bar_lng: number | null;
  bar_name: string | null;
  head_start_ends_at: string | null;
  game_ends_at: string | null;
  city: string;
}

function useCountdown(isoTarget: string | null): string {
  const [display, setDisplay] = useState("--:--");
  useEffect(() => {
    if (!isoTarget) { setDisplay("--:--"); return; }
    const tick = () => {
      const diff = new Date(isoTarget).getTime() - Date.now();
      if (diff <= 0) { setDisplay("00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setDisplay(
        h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return display;
}

export default function HuntScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [session, setSession] = useState<Awaited<ReturnType<typeof loadSession>>>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerMarker[]>([]);
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const myTeamId = useRef<string | null>(null);

  const isHeadStart = game?.status === "head_start";
  const timerTarget = isHeadStart ? game?.head_start_ends_at : game?.game_ends_at;
  const timer = useCountdown(timerTarget ?? null);
  const lang = game?.language ?? "en";

  // Load session from AsyncStorage once
  useEffect(() => {
    loadSession().then(setSession).catch(() => {});
  }, []);

  // GPS tracking — only active during hunt
  useBackgroundLocation({
    playerToken: session?.playerToken ?? null,
    enabled: !!session?.playerToken && game?.status === "active",
  });

  // Fetch initial state
  useEffect(() => {
    if (!code) return;
    const fetch_ = async () => {
      const res = await fetch(`${API()}/api/v1/games/${code}/state`);
      if (!res.ok) return;
      const data = await res.json() as {
        game: GameInfo;
        players: Array<{
          id: string; last_lat: number | null; last_lng: number | null;
          emoji: string; name: string; team_id: string | null;
        }>;
        teams: Team[];
        circle: { center_lat: number; center_lng: number; radius_m: number } | null;
      };

      setGame(data.game);
      setTeams([...data.teams].sort((a, b) => b.score - a.score));

      const sess = await loadSession();
      const me = data.players.find((p) => p.id === sess?.playerId);
      myTeamId.current = me?.team_id ?? null;

      setPlayers(
        data.players
          .filter((p) => p.last_lat != null && p.last_lng != null)
          .map((p) => ({
            id: p.id,
            lat: p.last_lat!,
            lng: p.last_lng!,
            emoji: p.emoji,
            name: p.name,
            isMe: p.id === sess?.playerId,
            color: data.teams.find((t) => t.id === p.team_id)?.color,
          })),
      );

      if (data.circle) {
        setCircle({ lat: data.circle.center_lat, lng: data.circle.center_lng, radiusM: data.circle.radius_m });
      }

      if (data.game.status === "active" && me?.team_id) {
        void fetchChallenge(data.game.id, me.team_id, data.game.language, data.game.city);
      }
    };
    void fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchChallenge = async (gameId: string, teamId: string, language = "en", city = "montreal") => {
    const res = await fetch(`${API()}/api/v1/challenges/random/${gameId}/${teamId}?city=${city}`);
    if (res.ok) {
      setChallenge(await res.json() as Challenge);
      setChallengeDone(false);
    } else {
      setChallenge(null);
    }
  };

  const submitChallenge = async () => {
    if (!challenge || !session || !myTeamId.current || !game) return;
    await fetch(`${API()}/api/v1/challenges/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game.id,
        challenge_id: challenge.id,
        team_id: myTeamId.current,
        player_token: session.playerToken,
        media_url: "",
      }),
    });
    setChallengeDone(true);
    setTimeout(() => void fetchChallenge(game.id, myTeamId.current!, game.language, game.city), 2_000);
  };

  // Score poll every 15 s
  useEffect(() => {
    if (!game?.id) return;
    const id = setInterval(async () => {
      const res = await fetch(`${API()}/api/v1/teams/${game.id}/all`).catch(() => null);
      if (res?.ok) {
        const t = await res.json() as Team[];
        setTeams([...t].sort((a, b) => b.score - a.score));
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [game?.id]);

  // WebSocket handler
  const handleWs = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "location:update":
        setPlayers((prev) => {
          const idx = prev.findIndex((p) => p.id === msg.player_id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx]!, lat: msg.lat as number, lng: msg.lng as number };
          return next;
        });
        break;
      case "circle:shrink":
        setCircle({ lat: msg.lat as number, lng: msg.lng as number, radiusM: msg.radius_m as number });
        break;
      case "game:started":
        setGame((g) => g ? { ...g, status: "active" } : g);
        if (game?.id && myTeamId.current) {
          void fetchChallenge(game.id, myTeamId.current, game.language, game.city ?? "montreal");
        }
        break;
      case "game:ended":
        router.replace(`/game/results/${code as string}`);
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, game?.id]);

  useGameSocket(game?.id ?? null, session?.playerId ?? null, handleWs);

  const myTeam = teams.find((t) => t.id === myTeamId.current);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0805" />

      {/* Full-screen map */}
      <NativeMap
        players={players}
        circle={circle}
        barLat={game?.bar_lat ?? undefined}
        barLng={game?.bar_lng ?? undefined}
        isChicken={false}
      />

      {/* Top HUD */}
      <SafeAreaView style={s.topHud} pointerEvents="box-none">
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <Text style={s.codeText}>{code}</Text>
            {isHeadStart && (
              <View style={s.headStartBadge}>
                <Text style={s.headStartText}>HEAD START</Text>
              </View>
            )}
          </View>
          <View style={s.topRight}>
            <Text style={s.timerText}>{timer}</Text>
            <TouchableOpacity style={s.lbBtn} onPress={() => setShowLeaderboard(true)}>
              <Text style={s.lbBtnText}>📊</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* My team score overlay */}
      {myTeam && (
        <View style={[s.scoreOverlay, { borderColor: myTeam.color }]}>
          <Text style={s.scoreTeamName}>{myTeam.name}</Text>
          <Text style={[s.scoreValue, { color: myTeam.color }]}>
            {myTeam.score.toLocaleString()} pts
          </Text>
        </View>
      )}

      {/* Head-start overlay at bottom */}
      {isHeadStart && (
        <View style={s.headStartOverlay}>
          <Text style={s.hsLabel}>Chicken is hiding…</Text>
          <Text style={s.hsTimer}>{timer}</Text>
          <Text style={s.hsSub}>until hunt begins</Text>
        </View>
      )}

      {/* Challenge panel */}
      {!isHeadStart && (
        <View style={s.challengePanel}>
          {challenge ? (
            <View style={s.challengeRow}>
              <View style={s.challengeInfo}>
                <View style={s.challengeMeta}>
                  <Text style={s.challengeCategory}>{challenge.category.toUpperCase()}</Text>
                  <Text style={s.challengePoints}>+{challenge.points} pts</Text>
                </View>
                <Text style={s.challengeTitle} numberOfLines={2}>
                  {lang === "fr" ? challenge.title_fr : challenge.title_en}
                </Text>
                <Text style={s.challengeDesc} numberOfLines={2}>
                  {lang === "fr" ? challenge.desc_fr : challenge.desc_en}
                </Text>
              </View>
              <View style={s.challengeAction}>
                {challengeDone ? (
                  <View style={s.doneBadge}>
                    <Text style={s.doneBadgeText}>✓</Text>
                    <Text style={s.doneSubText}>Next{"\n"}soon…</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.doneBtn}
                    onPress={() => void submitChallenge()}
                  >
                    <Text style={s.doneBtnText}>DONE ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <Text style={s.noChallengeText}>No more challenges 🎉</Text>
          )}
        </View>
      )}

      {/* Leaderboard modal */}
      <Modal visible={showLeaderboard} animationType="slide" transparent>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>LEADERBOARD</Text>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={teams}
              keyExtractor={(t) => t.id}
              renderItem={({ item, index }) => (
                <View style={[
                  s.lbRow,
                  item.id === myTeamId.current && s.lbRowMe,
                ]}>
                  <Text style={s.lbRank}>#{index + 1}</Text>
                  <View style={[s.lbDot, { backgroundColor: item.color }]} />
                  <Text style={s.lbName} numberOfLines={1}>{item.name}</Text>
                  {item.found_order != null && (
                    <Text style={s.lbFound}>Found #{item.found_order}</Text>
                  )}
                  <Text style={[s.lbScore, { color: item.color }]}>
                    {item.score.toLocaleString()}
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0805" },

  topHud: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
    backgroundColor: "rgba(10,8,5,0.88)",
    borderBottomWidth: 1, borderBottomColor: "rgba(245,197,24,0.2)",
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  codeText: { fontFamily: "monospace", fontSize: 18, fontWeight: "700", color: "#F5C518", letterSpacing: 3 },
  headStartBadge: { borderWidth: 1, borderColor: "#F0EAD6", paddingHorizontal: 8, paddingVertical: 2 },
  headStartText: { fontFamily: "monospace", color: "#F0EAD6", fontSize: 10, letterSpacing: 1 },
  timerText: { fontFamily: "monospace", fontSize: 22, fontWeight: "700", color: "#F5C518" },
  lbBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lbBtnText: { fontSize: 20 },

  scoreOverlay: {
    position: "absolute", bottom: 172, left: 16, zIndex: 50,
    backgroundColor: "rgba(10,8,5,0.9)", borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  scoreTeamName: { fontFamily: "monospace", color: "#8B7355", fontSize: 10, textTransform: "uppercase" },
  scoreValue: { fontSize: 22, fontWeight: "700" },

  headStartOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 80,
    backgroundColor: "rgba(10,8,5,0.92)", borderTopWidth: 1, borderTopColor: "rgba(245,197,24,0.2)",
    paddingBottom: 40, paddingTop: 20, alignItems: "center",
  },
  hsLabel: { fontFamily: "monospace", color: "#8B7355", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 },
  hsTimer: { fontSize: 56, fontWeight: "700", color: "#F5C518", marginVertical: 4 },
  hsSub: { fontFamily: "monospace", color: "#8B7355", fontSize: 12 },

  challengePanel: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 80,
    backgroundColor: "rgba(10,8,5,0.95)", borderTopWidth: 1,
    borderTopColor: "rgba(245,197,24,0.25)", paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 36,
    minHeight: 140,
  },
  challengeRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  challengeInfo: { flex: 1 },
  challengeMeta: { flexDirection: "row", gap: 8, marginBottom: 6 },
  challengeCategory: {
    fontFamily: "monospace", color: "#F5C518", fontSize: 10,
    borderWidth: 1, borderColor: "rgba(245,197,24,0.4)",
    paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 1,
  },
  challengePoints: { fontFamily: "monospace", color: "#F5C518", fontSize: 11 },
  challengeTitle: { fontSize: 17, fontWeight: "700", color: "#F0EAD6", lineHeight: 22 },
  challengeDesc: { fontSize: 13, color: "#8B7355", fontStyle: "italic", marginTop: 4, lineHeight: 18 },
  challengeAction: { paddingTop: 4 },
  doneBtn: { backgroundColor: "#F5C518", paddingHorizontal: 16, paddingVertical: 12 },
  doneBtnText: { fontWeight: "700", color: "#0A0805", fontSize: 13, letterSpacing: 1 },
  doneBadge: { alignItems: "center" },
  doneBadgeText: { fontSize: 22, color: "#F5C518" },
  doneSubText: { fontFamily: "monospace", color: "#8B7355", fontSize: 10, textAlign: "center", marginTop: 2 },
  noChallengeText: { textAlign: "center", color: "#8B7355", fontStyle: "italic", paddingVertical: 24 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#0F0C08", borderTopWidth: 1, borderTopColor: "rgba(245,197,24,0.3)", maxHeight: "70%", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(245,197,24,0.15)" },
  modalTitle: { fontWeight: "700", color: "#F5C518", fontSize: 18, letterSpacing: 2 },
  modalClose: { color: "#8B7355", fontSize: 18, padding: 4 },
  lbRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(139,115,85,0.15)", gap: 10 },
  lbRowMe: { backgroundColor: "rgba(245,197,24,0.05)" },
  lbRank: { fontFamily: "monospace", color: "#F5C518", width: 28, fontSize: 13 },
  lbDot: { width: 10, height: 10, borderRadius: 5 },
  lbName: { flex: 1, color: "#F0EAD6", fontSize: 15 },
  lbFound: { color: "#2DC653", fontSize: 11, fontFamily: "monospace" },
  lbScore: { fontWeight: "700", fontSize: 16 },
});
