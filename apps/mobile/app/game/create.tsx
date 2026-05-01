import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

const CITIES = ["montreal", "paris", "london", "nyc", "tunis"] as const;

export default function CreateScreen() {
  const [name, setName] = useState("");
  const [city, setCity] = useState<string>("montreal");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${API}/api/v1/games/?host_name=Host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Chicken Hunt", city, language }),
      });
      if (!res.ok) throw new Error("Failed to create game");
      const d = (await res.json()) as { game_code: string };
      router.push(`/game/lobby/${d.game_code}`);
    } catch (e) {
      Alert.alert("Error", "Could not create game. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Create a Hunt</Text>

      <Text style={s.label}>Game Name</Text>
      <TextInput
        style={s.input}
        placeholder="Friday Night Hunt"
        placeholderTextColor="#8B7355"
        value={name}
        onChangeText={setName}
      />

      <Text style={s.label}>City</Text>
      <View style={s.pills}>
        {CITIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCity(c)} style={[s.pill, city === c && s.pillOn]}>
            <Text style={[s.pillTxt, city === c && s.pillTxtOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Language</Text>
      <View style={s.pills}>
        {(["en", "fr"] as const).map((l) => (
          <TouchableOpacity key={l} onPress={() => setLanguage(l)} style={[s.pill, language === l && s.pillOn]}>
            <Text style={[s.pillTxt, language === l && s.pillTxtOn]}>{l === "en" ? "English" : "Français"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handle} disabled={loading}>
        <Text style={s.btnTxt}>{loading ? "Creating..." : "CREATE HUNT 🐔"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0805" },
  content: { padding: 24 },
  title: { fontSize: 40, fontWeight: "700", color: "#F5C518", marginBottom: 32 },
  label: { color: "#8B7355", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#8B7355", color: "#F0EAD6", padding: 14, marginBottom: 24, fontSize: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 32 },
  pill: { borderWidth: 1, borderColor: "#8B7355", paddingHorizontal: 16, paddingVertical: 8 },
  pillOn: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
  pillTxt: { color: "#8B7355", fontSize: 12, textTransform: "uppercase" },
  pillTxtOn: { color: "#0A0805", fontWeight: "700" },
  btn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center" },
  btnOff: { opacity: 0.5 },
  btnTxt: { fontSize: 20, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
});
