import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Share } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { loadSession } from "@/utils/session";

interface Player {
  id: string;
  name: string;
  emoji: string;
  role: string;
  team_id: string | null;
}

interface GameInfo {
  id: string;
  code: string;
  name: string;
  status: string;
  buy_in_amount: number;
  num_chickens: number;
}

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [game, setGame] = useState<GameInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
  const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";

  const navigateByRole = useCallback((role: string, gameCode: string) => {
    if (role === "chicken") {
      router.replace(`/game/chicken/${gameCode}`);
    } else {
      router.replace(`/game/hunt/${gameCode}`);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const gr = await fetch(`${API}/api/v1/games/${code}`);
      if (!gr.ok) return;
      const g = (await gr.json()) as GameInfo;
      setGame(g);

      if (g.status === "head_start" || g.status === "active") {
        const session = await loadSession();
        if (session?.playerToken) {
          const pr = await fetch(`${API}/api/v1/players/me/${session.playerToken}`);
          if (pr.ok) {
            const me = (await pr.json()) as { role: string };
            navigateByRole(me.role, code ?? "");
          }
        }
        return;
      }

      const pr = await fetch(`${API}/api/v1/players/${g.id}/all`);
      if (pr.ok) setPlayers((await pr.json()) as Player[]);
    } catch {
      // silently retry
    }
  }, [code, API, navigateByRole]);

  useEffect(() => {
    void (async () => {
      const session = await loadSession();
      if (!session?.gameId || !session?.playerId) return;

      const ws = new WebSocket(`${WS_URL}/ws/${session.gameId}/${session.playerId}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as {
            type: string;
            players?: Player[];
          };
          if (msg.type === "game:started" && msg.players) {
            const me = msg.players.find((p) => p.id === session.playerId);
            if (me) navigateByRole(me.role, code ?? "");
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => ws.close();
    })();

    return () => { wsRef.current?.close(); };
  }, [WS_URL, code, navigateByRole]);

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 4000);
    return () => clearInterval(id);
  }, [fetchData]);

  const shareCode = async () => {
    await Share.share({ message: `Join my Le Poulet hunt! Code: ${code ?? ""}\nlepoulet.gg/join` });
  };

  const pot = (game?.buy_in_amount ?? 0) * players.length;

  return (
    <View style={s.c}>
      <TouchableOpacity onPress={shareCode}>
        <Text style={s.code}>{code}</Text>
      </TouchableOpacity>
      <Text style={s.sub}>Tap to share • Waiting for players…</Text>

      {game && (
        <View style={s.gameInfo}>
          <Text style={s.gameName}>{game.name}</Text>
          {pot > 0 && <Text style={s.pot}>💰 POT: ${pot}</Text>}
        </View>
      )}

      <Text style={s.label}>PLAYERS ({players.length})</Text>

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.emoji}>{item.emoji}</Text>
            <Text style={s.name}>{item.name}</Text>
            {item.role === "host" && <Text style={s.host}>HOST</Text>}
          </View>
        )}
        contentContainerStyle={s.list}
      />

      <View style={s.box}>
        <Text style={s.wait}>🐔 Waiting for host to start…</Text>
        <Text style={s.waitSub}>You&apos;ll be assigned a role when the game begins</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", padding: 24 },
  code: { fontSize: 64, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 8, marginTop: 16 },
  sub: { color: "#8B7355", textAlign: "center", marginBottom: 16, fontSize: 11 },
  gameInfo: { alignItems: "center", marginBottom: 16, gap: 4 },
  gameName: { color: "#F0EAD6", fontSize: 18, fontWeight: "600" },
  pot: { color: "#F5C518", fontSize: 14, fontWeight: "700" },
  label: { color: "#8B7355", fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  list: { paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#3a3020", padding: 12, marginBottom: 6, borderRadius: 4 },
  emoji: { fontSize: 22, marginRight: 12 },
  name: { flex: 1, color: "#F0EAD6", fontSize: 16 },
  host: { color: "#F5C518", fontSize: 10, borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 8, paddingVertical: 2 },
  box: { marginTop: 16, borderWidth: 1, borderColor: "#3a3020", padding: 20, alignItems: "center" },
  wait: { color: "#F0EAD6", fontStyle: "italic", marginBottom: 4, textAlign: "center" },
  waitSub: { color: "#8B7355", fontSize: 12 },
});
