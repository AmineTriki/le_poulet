import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import NativeMap from "@/components/NativeMap";

export default function ChickenScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.headerText}>🐔 YOU ARE THE CHICKEN — STAY HIDDEN</Text>
      </View>
      <NativeMap gameCode={code ?? ""} isChicken />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805" },
  header: { backgroundColor: "#C1121F", padding: 12, zIndex: 10 },
  headerText: { color: "white", fontSize: 12, textAlign: "center", fontWeight: "700", letterSpacing: 1 },
});
