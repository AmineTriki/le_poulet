import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { clearSession } from "@/hooks/useSession";

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  found_order: number | null;
  chaos_points: number;
}

export default function ResultsScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${API}/api/v1/games/${code}`)
      .then((r) => r.json() as Promise<{ id: string }>)
      .then((g) => fetch(`${API}/api/v1/teams/${g.id}/all`))
      .then((r) => r.json() as Promise<Team[]>)
      .then((t) => setTeams([...t].sort((a, b) => b.score - a.score)))
      .catch(console.error);
  }, [code]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View style={s.c}>
      <Text style={s.title}>GAME OVER</Text>
      <Text style={s.emoji}>🐔</Text>

      {teams[0] && (
        <View style={s.winner}>
          <Text style={s.wLabel}>WINNER</Text>
          <Text style={s.wName}>{teams[0].name}</Text>
          <Text style={s.wScore}>{teams[0].score} pts</Text>
        </View>
      )}

      <Text style={s.label}>FINAL SCORES</Text>

      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => (
          <View style={s.row}>
            <Text style={s.rank}>{medals[index] ?? `#${index + 1}`}</Text>
            <View style={[s.dot, { backgroundColor: item.color }]} />
            <Text style={s.name}>{item.name}</Text>
            {item.found_order != null && (
              <Text style={s.found}>Found #{item.found_order}</Text>
            )}
            <Text style={s.score}>{item.score} pts</Text>
          </View>
        )}
        contentContainerStyle={s.list}
      />

      <TouchableOpacity style={s.home} onPress={async () => { await clearSession(); router.replace("/"); }}>
        <Text style={s.homeTxt}>PLAY AGAIN →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", padding: 24 },
  title: { fontSize: 52, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 4, marginBottom: 8 },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 16 },
  winner: { borderWidth: 2, borderColor: "#F5C518", padding: 20, alignItems: "center", marginBottom: 24 },
  wLabel: { color: "#8B7355", fontSize: 11, letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" },
  wName: { fontSize: 28, fontWeight: "700", color: "#F5C518", marginBottom: 4 },
  wScore: { fontSize: 24, color: "#F5C518" },
  label: { color: "#8B7355", fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  list: { paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#8B7355", padding: 12, marginBottom: 8, gap: 8 },
  rank: { fontSize: 20, width: 32 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, color: "#F0EAD6", fontSize: 15 },
  found: { color: "#2DC653", fontSize: 12 },
  score: { color: "#F5C518", fontSize: 16, fontWeight: "700" },
  home: { marginTop: 16, borderWidth: 1, borderColor: "#F5C518", padding: 16, alignItems: "center" },
  homeTxt: { color: "#F5C518", fontSize: 16, fontWeight: "700", letterSpacing: 2 },
});
