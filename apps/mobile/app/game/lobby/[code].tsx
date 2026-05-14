import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Share,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import NativeRoulette from "@/components/NativeRoulette";
import { useGameSocket, type WsMessage } from "@/hooks/useGameSocket";
import { loadSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

interface Player {
  id: string;
  name: string;
  emoji: string;
  role: string;
  score: number;
}

interface GameInfo {
  id: string;
  name: string;
  status: string;
  buy_in_amount: number;
  head_start_minutes: number;
  game_duration_hours: number;
  language: string;
}

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [session, setSession] = useState<Awaited<ReturnType<typeof loadSession>>>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteDone, setRouletteDone] = useState(false);
  const [starting, setStarting] = useState(false);

  const isHost = session?.isHost === true && session.gameCode === code;
  const gameId = game?.id ?? session?.gameId ?? null;
  const playerId = session?.playerId ?? null;

  useEffect(() => {
    loadSession().then(setSession).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const gr = await fetch(`${API()}/api/v1/games/${code}`);
      if (!gr.ok) return;
      const g = await gr.json() as GameInfo;
      setGame(g);

      if (g.status !== "lobby") {
        // Game already started — redirect
        const sess = await loadSession();
        if (sess?.playerToken) {
          const pr = await fetch(`${API()}/api/v1/players/me/${sess.playerToken}`);
          if (pr.ok) {
            const p = await pr.json() as { role: string };
            router.replace(p.role === "chicken" ? `/game/chicken/${code}` : `/game/hunt/${code}`);
            return;
          }
        }
        router.replace(`/game/hunt/${code}`);
        return;
      }

      const pr = await fetch(`${API()}/api/v1/players/${g.id}/all`);
      if (pr.ok) setPlayers(await pr.json() as Player[]);
    } catch {
      // silently retry
    }
  }, [code]);

  useEffect(() => {
    void fetchData();
    // Poll every 4 s as a fallback behind WebSocket
    const id = setInterval(() => void fetchData(), 4_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const redirectByRole = useCallback(async () => {
    const sess = await loadSession();
    if (!sess?.playerToken) { router.replace(`/game/hunt/${code}`); return; }
    try {
      const res = await fetch(`${API()}/api/v1/players/me/${sess.playerToken}`);
      if (!res.ok) { router.replace(`/game/hunt/${code}`); return; }
      const p = await res.json() as { role: string };
      router.replace(p.role === "chicken" ? `/game/chicken/${code}` : `/game/hunt/${code}`);
    } catch {
      router.replace(`/game/hunt/${code}`);
    }
  }, [code]);

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type === "player:joined") {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === msg.player_id)) return prev;
        return [...prev, {
          id: msg.player_id as string,
          name: msg.name as string,
          emoji: msg.emoji as string,
          role: "hunter",
          score: 0,
        }];
      });
    } else if (msg.type === "player:left") {
      setPlayers((prev) => prev.filter((p) => p.id !== msg.player_id));
    } else if (msg.type === "game:started") {
      void redirectByRole();
    }
  }, [redirectByRole]);

  useGameSocket(gameId, playerId, handleWs);

  const shareCode = async () => {
    await Share.share({
      message: `Join my Le Poulet hunt! Code: ${code ?? ""}\nDownload at lepoulet.gg`,
    });
  };

  const handleStartGame = async () => {
    if (!isHost || !session?.hostToken || !code) return;
    setStarting(true);
    try {
      const res = await fetch(`${API()}/api/v1/games/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_token: session.hostToken }),
      });
      if (!res.ok) {
        Alert.alert("Error", "Could not start game. Are you the host?");
        setStarting(false);
      }
      // WS game:started → redirectByRole
    } catch {
      Alert.alert("Error", "Network error. Try again.");
      setStarting(false);
    }
  };

  if (showRoulette) {
    return (
      <SafeAreaView style={s.rouletteRoot}>
        <Text style={s.rouletteTitle}>WHO IS THE CHICKEN?</Text>
        <NativeRoulette
          players={players.map((p) => ({ name: p.name, emoji: p.emoji }))}
          onResult={() => setRouletteDone(true)}
        />
        {rouletteDone && (
          <View style={s.rouletteBottom}>
            <Text style={s.rouletteSub}>
              {isHost
                ? "The server picks the real chicken — this was for drama 🐔"
                : "Waiting for host to start…"}
            </Text>
            {isHost && (
              <TouchableOpacity
                style={[s.startBtn, starting && s.startBtnOff]}
                onPress={() => void handleStartGame()}
                disabled={starting}
              >
                {starting
                  ? <ActivityIndicator color="#0A0805" />
                  : <Text style={s.startBtnText}>START THE HUNT 🐔</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Game code hero */}
      <TouchableOpacity style={s.codeBlock} onPress={shareCode} activeOpacity={0.7}>
        <Text style={s.codeSub}>{game?.name ?? "Loading…"}</Text>
        <Text style={s.code}>{code}</Text>
        <Text style={s.codeTap}>Tap to share</Text>
      </TouchableOpacity>

      {/* Game settings strip */}
      {game && (
        <View style={s.strip}>
          <View style={s.stripItem}>
            <Text style={s.stripLabel}>HEAD START</Text>
            <Text style={s.stripValue}>{game.head_start_minutes}min</Text>
          </View>
          <View style={s.stripDivider} />
          <View style={s.stripItem}>
            <Text style={s.stripLabel}>DURATION</Text>
            <Text style={s.stripValue}>{game.game_duration_hours}h</Text>
          </View>
          <View style={s.stripDivider} />
          <View style={s.stripItem}>
            <Text style={s.stripLabel}>BUY-IN</Text>
            <Text style={s.stripValue}>{game.buy_in_amount === 0 ? "Free" : `$${game.buy_in_amount}`}</Text>
          </View>
        </View>
      )}

      {/* Player list */}
      <View style={s.playerHeader}>
        <Text style={s.playerTitle}>PLAYERS</Text>
        <Text style={s.playerCount}>{players.length} joined</Text>
      </View>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={s.playerGrid}
        contentContainerStyle={s.playerList}
        renderItem={({ item }) => (
          <View style={[
            s.playerChip,
            item.id === playerId && s.playerChipMe,
          ]}>
            <Text style={s.playerEmoji}>{item.emoji}</Text>
            <View style={s.playerInfo}>
              <Text style={s.playerName} numberOfLines={1}>{item.name}</Text>
              {item.id === playerId && <Text style={s.playerYou}>you</Text>}
              {item.role === "host" && <Text style={s.playerRole}>HOST</Text>}
            </View>
          </View>
        )}
      />

      {/* CTA */}
      <View style={s.ctaArea}>
        {isHost && players.length >= 2 && (
          <TouchableOpacity style={s.spinBtn} onPress={() => setShowRoulette(true)}>
            <Text style={s.spinBtnText}>SPIN THE ROULETTE 🎡</Text>
          </TouchableOpacity>
        )}
        {isHost && players.length < 2 && (
          <View style={s.waitBox}>
            <Text style={s.waitText}>Waiting for more players to join…</Text>
          </View>
        )}
        {!isHost && (
          <View style={s.waitBox}>
            <Text style={s.waitText}>Waiting for host to spin the roulette…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0805" },

  codeBlock: { alignItems: "center", paddingTop: 24, paddingBottom: 16 },
  codeSub: { fontFamily: "monospace", color: "#8B7355", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 },
  code: { fontSize: 72, fontWeight: "700", color: "#F5C518", letterSpacing: 10 },
  codeTap: { fontFamily: "monospace", color: "#8B7355", fontSize: 11, marginTop: 4 },

  strip: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(139,115,85,0.25)", marginHorizontal: 16 },
  stripItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  stripLabel: { fontFamily: "monospace", color: "#8B7355", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  stripValue: { fontWeight: "700", color: "#F5C518", fontSize: 18 },
  stripDivider: { width: 1, backgroundColor: "rgba(139,115,85,0.25)" },

  playerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  playerTitle: { fontWeight: "700", color: "#F5C518", fontSize: 16, letterSpacing: 2 },
  playerCount: { fontFamily: "monospace", color: "#8B7355", fontSize: 12 },
  playerList: { paddingHorizontal: 16 },
  playerGrid: { gap: 10, marginBottom: 10 },
  playerChip: {
    flex: 1, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(139,115,85,0.35)",
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  playerChipMe: { borderColor: "#F5C518", backgroundColor: "rgba(245,197,24,0.05)" },
  playerEmoji: { fontSize: 24 },
  playerInfo: { flex: 1 },
  playerName: { color: "#F0EAD6", fontSize: 14 },
  playerYou: { fontFamily: "monospace", color: "#F5C518", fontSize: 10 },
  playerRole: { fontFamily: "monospace", color: "#F5C518", fontSize: 10, letterSpacing: 1 },

  ctaArea: { padding: 16, paddingBottom: 24 },
  spinBtn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center" },
  spinBtnText: { fontWeight: "700", color: "#0A0805", fontSize: 20, letterSpacing: 2 },
  waitBox: { borderWidth: 1, borderColor: "rgba(139,115,85,0.3)", padding: 20, alignItems: "center" },
  waitText: { color: "#8B7355", fontStyle: "italic", fontSize: 14, textAlign: "center" },

  rouletteRoot: { flex: 1, backgroundColor: "#0A0805", alignItems: "center" },
  rouletteTitle: { fontSize: 28, fontWeight: "700", color: "#F5C518", letterSpacing: 3, marginTop: 24, marginBottom: 16 },
  rouletteBottom: { paddingHorizontal: 24, alignItems: "center", gap: 16, paddingBottom: 40 },
  rouletteSub: { color: "#8B7355", fontStyle: "italic", textAlign: "center", fontSize: 13 },
  startBtn: { backgroundColor: "#F5C518", paddingHorizontal: 40, paddingVertical: 18 },
  startBtnOff: { opacity: 0.5 },
  startBtnText: { fontWeight: "700", color: "#0A0805", fontSize: 20, letterSpacing: 2 },
});
