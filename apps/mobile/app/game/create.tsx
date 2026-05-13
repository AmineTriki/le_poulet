import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { saveSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const CITIES = ["montreal", "paris", "london", "nyc", "tunis"] as const;
type City = typeof CITIES[number];

const CITY_LABELS: Record<City, string> = {
  montreal: "Montréal",
  paris: "Paris",
  london: "London",
  nyc: "New York",
  tunis: "Tunis",
};

const HEAD_START_OPTIONS = [15, 20, 30, 45, 60] as const;
const DURATION_OPTIONS = [1, 1.5, 2, 3] as const;

export default function CreateScreen() {
  const [name, setName] = useState("");
  const [hostName, setHostName] = useState("");
  const [city, setCity] = useState<City>("montreal");
  const [language, setLanguage] = useState<"en" | "fr">("fr");
  const [headStart, setHeadStart] = useState<number>(30);
  const [duration, setDuration] = useState<number>(2);
  const [loading, setLoading] = useState(false);

  const canCreate = hostName.trim().length >= 2;

  const handle = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API()}/api/v1/games/?host_name=${encodeURIComponent(hostName.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || `${hostName.trim()}'s Hunt`,
            city,
            language,
            head_start_minutes: headStart,
            game_duration_hours: duration,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to create game");
      const d = await res.json() as {
        game_code: string;
        game_id: string;
        host_player_id: string;
        host_token: string;
      };

      await saveSession({
        gameCode: d.game_code,
        gameId: d.game_id,
        playerId: d.host_player_id,
        playerToken: d.host_token,
        isHost: true,
        hostToken: d.host_token,
      });

      router.replace(`/game/lobby/${d.game_code}`);
    } catch {
      Alert.alert("Error", "Could not create game. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>CREATE A HUNT</Text>

        <Text style={s.label}>YOUR NAME</Text>
        <TextInput
          style={s.input}
          placeholder="Enter your name"
          placeholderTextColor="#4a3f2f"
          value={hostName}
          onChangeText={setHostName}
          maxLength={30}
          autoFocus
        />

        <Text style={s.label}>GAME NAME <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={s.input}
          placeholder="Friday Night Hunt"
          placeholderTextColor="#4a3f2f"
          value={name}
          onChangeText={setName}
          maxLength={60}
        />

        <Text style={s.label}>CITY</Text>
        <View style={s.pills}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                setCity(c);
                setLanguage(c === "montreal" || c === "paris" || c === "tunis" ? "fr" : "en");
              }}
              style={[s.pill, city === c && s.pillOn]}
            >
              <Text style={[s.pillTxt, city === c && s.pillTxtOn]}>{CITY_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>LANGUAGE</Text>
        <View style={s.pills}>
          {(["en", "fr"] as const).map((l) => (
            <TouchableOpacity key={l} onPress={() => setLanguage(l)} style={[s.pill, language === l && s.pillOn]}>
              <Text style={[s.pillTxt, language === l && s.pillTxtOn]}>{l === "en" ? "English" : "Français"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>HEAD START</Text>
        <View style={s.pills}>
          {HEAD_START_OPTIONS.map((m) => (
            <TouchableOpacity key={m} onPress={() => setHeadStart(m)} style={[s.pill, headStart === m && s.pillOn]}>
              <Text style={[s.pillTxt, headStart === m && s.pillTxtOn]}>{m}min</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>DURATION</Text>
        <View style={s.pills}>
          {DURATION_OPTIONS.map((h) => (
            <TouchableOpacity key={h} onPress={() => setDuration(h)} style={[s.pill, duration === h && s.pillOn]}>
              <Text style={[s.pillTxt, duration === h && s.pillTxtOn]}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, (!canCreate || loading) && s.btnOff]}
          onPress={() => void handle()}
          disabled={!canCreate || loading}
        >
          {loading
            ? <ActivityIndicator color="#0A0805" />
            : <Text style={s.btnTxt}>CREATE HUNT 🐔</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0805" },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 36, fontWeight: "700", color: "#F5C518", marginBottom: 32, letterSpacing: 3 },
  label: { color: "#8B7355", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 },
  optional: { fontSize: 10, color: "#4a3f2f", fontStyle: "italic" },
  input: {
    borderWidth: 1, borderColor: "#3a3020", color: "#F0EAD6",
    padding: 14, marginBottom: 28, fontSize: 16, backgroundColor: "#0f0c08",
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  pill: { borderWidth: 1, borderColor: "#3a3020", paddingHorizontal: 16, paddingVertical: 9 },
  pillOn: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
  pillTxt: { color: "#8B7355", fontSize: 13 },
  pillTxtOn: { color: "#0A0805", fontWeight: "700" },
  btn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center", marginTop: 8 },
  btnOff: { opacity: 0.4 },
  btnTxt: { fontSize: 20, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
});
