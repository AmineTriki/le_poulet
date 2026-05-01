import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

export default function JoinScreen() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (code.length !== 6 || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
      const r = await fetch(`${API}/api/v1/games/${code.toUpperCase()}`);
      if (!r.ok) {
        setError("Game not found. Check the code and try again.");
        setLoading(false);
        return;
      }
      const g = (await r.json()) as { id: string };
      const pr = await fetch(`${API}/api/v1/players/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: g.id, name: name.trim() }),
      });
      if (!pr.ok) {
        setError("Could not join game. It may have already started.");
        setLoading(false);
        return;
      }
      router.push(`/game/lobby/${code.toUpperCase()}`);
    } catch {
      setError("Something went wrong. Check your connection.");
      setLoading(false);
    }
  };

  const canJoin = code.length === 6 && name.trim().length > 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={s.c}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={s.emoji}>🐔</Text>
      <Text style={s.title}>JOIN THE HUNT</Text>

      <Text style={s.label}>Game Code</Text>
      <TextInput
        style={s.code}
        placeholder="XXXXXX"
        placeholderTextColor="#8B7355"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
      />

      <Text style={s.label}>Your Name</Text>
      <TextInput
        style={s.input}
        placeholder="Enter your name"
        placeholderTextColor="#8B7355"
        value={name}
        onChangeText={setName}
        maxLength={30}
      />

      {error ? <Text style={s.err}>{error}</Text> : null}

      <TouchableOpacity
        style={[s.btn, !canJoin && s.btnOff]}
        onPress={handle}
        disabled={!canJoin}
      >
        <Text style={s.btnTxt}>{loading ? "Joining..." : "JOIN →"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", padding: 24, justifyContent: "center" },
  emoji: { fontSize: 64, textAlign: "center", marginBottom: 16 },
  title: { fontSize: 36, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 4, marginBottom: 32 },
  label: { color: "#8B7355", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  code: { borderWidth: 2, borderColor: "#F5C518", color: "#F5C518", padding: 16, fontSize: 36, textAlign: "center", letterSpacing: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#8B7355", color: "#F0EAD6", padding: 14, fontSize: 16, marginBottom: 16 },
  err: { color: "#C1121F", marginBottom: 12, textAlign: "center" },
  btn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center" },
  btnOff: { opacity: 0.4 },
  btnTxt: { fontSize: 22, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
});
