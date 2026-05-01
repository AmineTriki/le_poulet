import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Share, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

interface Player {
  id: string;
  name: string;
  emoji: string;
  role: string;
  score: number;
}

interface GameState {
  id: string;
  code: string;
  name: string;
  status: string;
  player_count: number;
}

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [game, setGame] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const fetchData = useCallback(async () => {
    const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const gr = await fetch(`${API}/api/v1/games/${code}`);
      if (!gr.ok) return;
      const g = (await gr.json()) as GameState;
      setGame(g);

      if (g.status === "active") {
        router.replace(`/game/hunt/${code}`);
        return;
      }

      const pr = await fetch(`${API}/api/v1/players/${g.id}/all`);
      if (pr.ok) setPlayers((await pr.json()) as Player[]);
    } catch {
      // silently retry
    }
  }, [code]);

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 3000);
    return () => clearInterval(id);
  }, [fetchData]);

  const shareCode = async () => {
    await Share.share({
      message: `Join my Le Poulet chicken hunt! Code: ${code}\nDownload the app at lepoulet.gg`,
    });
  };

  return (
    <View style={s.c}>
      <TouchableOpacity onPress={shareCode}>
        <Text style={s.code}>{code}</Text>
      </TouchableOpacity>
      <Text style={s.sub}>Tap code to share • Waiting for players...</Text>

      {game && (
        <View style={s.gameInfo}>
          <Text style={s.gameName}>{game.name}</Text>
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
            {item.role === "chicken" && <Text style={s.chickenBadge}>🐔 CHICKEN</Text>}
          </View>
        )}
        contentContainerStyle={s.list}
      />

      <View style={s.box}>
        <Text style={s.wait}>🐔 Waiting for host to start the hunt...</Text>
        <Text style={s.waitSub}>The host will assign roles and pick a bar</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", padding: 24 },
  code: { fontSize: 72, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 8 },
  sub: { color: "#8B7355", textAlign: "center", marginBottom: 16, fontStyle: "italic", fontSize: 12 },
  gameInfo: { alignItems: "center", marginBottom: 16 },
  gameName: { color: "#F0EAD6", fontSize: 18, fontWeight: "600" },
  label: { color: "#8B7355", fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  list: { paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#8B7355", padding: 12, marginBottom: 8 },
  emoji: { fontSize: 24, marginRight: 12 },
  name: { flex: 1, color: "#F0EAD6", fontSize: 16 },
  host: { color: "#F5C518", fontSize: 11, borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 8, paddingVertical: 2 },
  chickenBadge: { color: "#C1121F", fontSize: 11, borderWidth: 1, borderColor: "#C1121F", paddingHorizontal: 8, paddingVertical: 2 },
  box: { marginTop: 16, borderWidth: 1, borderColor: "#8B7355", padding: 20, alignItems: "center" },
  wait: { color: "#F0EAD6", fontStyle: "italic", marginBottom: 4 },
  waitSub: { color: "#8B7355", fontSize: 12 },
});
