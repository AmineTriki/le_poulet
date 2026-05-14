import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <Text style={s.chicken}>🐔</Text>
        <Text style={s.title}>LE POULET</Text>
        <Text style={s.subtitle}>Hunt your friends. Win the pot.</Text>
      </View>

      <TouchableOpacity style={s.primary} onPress={() => router.push("/game/create")}>
        <Text style={s.primaryText}>START A HUNT 🐔</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.secondary} onPress={() => router.push("/game/join")}>
        <Text style={s.secondaryText}>JOIN A GAME</Text>
      </TouchableOpacity>

      <View style={s.row}>
        {[
          { l: "City", v: "MTL" },
          { l: "Play", v: "Free" },
          { l: "Cash Pot", v: "💸" },
        ].map((x) => (
          <View key={x.l} style={s.statCard}>
            <Text style={s.statVal}>{x.v}</Text>
            <Text style={s.statLbl}>{x.l}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0805" },
  content: { padding: 24, paddingTop: 40 },
  hero: { alignItems: "center", marginBottom: 40 },
  chicken: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 52, fontWeight: "700", color: "#F5C518", letterSpacing: 4 },
  subtitle: { fontSize: 16, color: "#F0EAD6", fontStyle: "italic", textAlign: "center", marginTop: 8 },
  primary: { backgroundColor: "#F5C518", padding: 18, alignItems: "center", marginBottom: 12 },
  primaryText: { fontSize: 20, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
  secondary: { borderWidth: 2, borderColor: "#F5C518", padding: 18, alignItems: "center", marginBottom: 40 },
  secondaryText: { fontSize: 20, fontWeight: "700", color: "#F5C518", letterSpacing: 2 },
  row: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderColor: "#8B7355", padding: 16, alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "700", color: "#F5C518" },
  statLbl: { fontSize: 11, color: "#8B7355", marginTop: 4, textTransform: "uppercase" },
});
