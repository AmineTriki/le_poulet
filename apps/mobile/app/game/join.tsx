import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { saveSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export default function JoinScreen() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canJoin = code.trim().length === 6 && name.trim().length >= 1 && !loading;

  const handle = async () => {
    if (!canJoin) return;
    setLoading(true);
    setError("");

    try {
      const upperCode = code.trim().toUpperCase();

      // 1. Verify game exists and is joinable
      const gr = await fetch(`${API()}/api/v1/games/${upperCode}`);
      if (!gr.ok) {
        setError("Game not found. Double-check the code.");
        setLoading(false);
        return;
      }
      const g = await gr.json() as { id: string; status: string };
      if (g.status !== "lobby") {
        setError("This game has already started.");
        setLoading(false);
        return;
      }

      // 2. Join
      const pr = await fetch(`${API()}/api/v1/players/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: g.id, name: name.trim() }),
      });
      if (!pr.ok) {
        setError("Could not join game. It may have already started.");
        setLoading(false);
        return;
      }
      const p = await pr.json() as { player_id: string; token: string; emoji: string };

      // 3. Persist session
      await saveSession({
        gameCode: upperCode,
        gameId: g.id,
        playerId: p.player_id,
        playerToken: p.token,
        isHost: false,
      });

      router.replace(`/game/lobby/${upperCode}`);
    } catch {
      Alert.alert("Error", "Something went wrong. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={s.emoji}>🐔</Text>
      <Text style={s.title}>JOIN THE HUNT</Text>

      <Text style={s.label}>GAME CODE</Text>
      <TextInput
        style={s.codeInput}
        placeholder="XXXXXX"
        placeholderTextColor="#3a3020"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        keyboardType="default"
        returnKeyType="next"
      />

      <Text style={s.label}>YOUR NAME</Text>
      <TextInput
        style={s.input}
        placeholder="Enter your name"
        placeholderTextColor="#3a3020"
        value={name}
        onChangeText={setName}
        maxLength={30}
        returnKeyType="go"
        onSubmitEditing={() => void handle()}
      />

      {!!error && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity
        style={[s.btn, !canJoin && s.btnOff]}
        onPress={() => void handle()}
        disabled={!canJoin}
      >
        {loading
          ? <ActivityIndicator color="#0A0805" />
          : <Text style={s.btnTxt}>JOIN →</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0805", padding: 28, justifyContent: "center" },
  emoji: { fontSize: 64, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 4, marginBottom: 36 },
  label: { color: "#8B7355", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  codeInput: {
    borderWidth: 2, borderColor: "#F5C518", color: "#F5C518", padding: 16,
    fontSize: 36, textAlign: "center", letterSpacing: 12, marginBottom: 24,
    backgroundColor: "#0f0c08",
  },
  input: {
    borderWidth: 1, borderColor: "#3a3020", color: "#F0EAD6", padding: 14,
    fontSize: 16, marginBottom: 8, backgroundColor: "#0f0c08",
  },
  error: { color: "#C1121F", marginBottom: 14, textAlign: "center", fontSize: 14 },
  btn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center", marginTop: 8 },
  btnOff: { opacity: 0.35 },
  btnTxt: { fontSize: 22, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
});
