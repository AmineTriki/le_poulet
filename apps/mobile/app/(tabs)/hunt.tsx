import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HuntTab() {
  return (
    <View style={s.c}>
      <Text style={s.emoji}>🗺️</Text>
      <Text style={s.t}>Join a game to see the hunt map</Text>
      <Text style={s.sub}>Use the Home tab to create or join a hunt</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", justifyContent: "center", alignItems: "center", padding: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  t: { color: "#F0EAD6", fontStyle: "italic", textAlign: "center", fontSize: 16, marginBottom: 8 },
  sub: { color: "#8B7355", textAlign: "center", fontSize: 13 },
});
