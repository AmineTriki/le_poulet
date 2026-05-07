import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  FlatList, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { saveSession } from "@/utils/session";

const CITIES = ["montreal", "paris", "london", "nyc", "tunis", "toronto", "berlin", "barcelona"];
const BUY_INS = [0, 5, 10, 20, 50];
const EMOJIS = ["🦊","🐺","🦁","🐯","🐻","🦅","🐉","🦄","🐸","🦋","🐬","🦉","🦝","🐨","🦘"];

interface Suggestion {
  num_chickens: number;
  team_size: number;
  num_teams: number;
  description: string;
  pot_examples: Record<string, number>;
}

interface Area {
  name: string;
  center_lat: number;
  center_lng: number;
  bar_count: number;
  bars: { id: string; name: string; lat: number; lng: number }[];
}

export default function CreateScreen() {
  const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("montreal");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [playerCount, setPlayerCount] = useState(10);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [numChickens, setNumChickens] = useState(1);
  const [teamSize, setTeamSize] = useState(4);
  const [buyIn, setBuyIn] = useState(0);
  const [customBuyIn, setCustomBuyIn] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSuggestion = useCallback(async (count: number) => {
    try {
      const r = await fetch(`${API}/api/v1/suggest/config?player_count=${count}`);
      if (r.ok) {
        const s = (await r.json()) as Suggestion;
        setSuggestion(s);
        setNumChickens(s.num_chickens);
        setTeamSize(s.team_size);
      }
    } catch { /* silent */ }
  }, [API]);

  useEffect(() => {
    void fetchSuggestion(playerCount);
  }, [playerCount, fetchSuggestion]);

  const fetchAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const r = await fetch(`${API}/api/v1/suggest/areas?city=${city}`);
      if (r.ok) setAreas((await r.json()) as Area[]);
    } catch { /* silent */ }
    setLoadingAreas(false);
  }, [API, city]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const hostName = "Host";
      const finalBuyIn = buyIn === -1 ? (parseInt(customBuyIn, 10) || 0) : buyIn;
      const res = await fetch(`${API}/api/v1/games/?host_name=${encodeURIComponent(hostName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Chicken Hunt",
          city: city.toLowerCase(),
          language,
          num_chickens: numChickens,
          team_size: teamSize,
          buy_in_amount: finalBuyIn,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = (await res.json()) as { game_code: string; game_id: string; host_token: string; host_player_id: string };
      await saveSession({
        gameCode: d.game_code,
        gameId: d.game_id,
        playerId: d.host_player_id,
        playerToken: d.host_token,
        playerName: hostName,
        playerEmoji: "👑",
        isHost: true,
        hostToken: d.host_token,
      });
      router.push(`/game/lobby/${d.game_code}`);
    } catch {
      setLoading(false);
    }
  };

  const pot = (buyIn === -1 ? (parseInt(customBuyIn, 10) || 0) : buyIn) * playerCount;
  const totalSteps = 4;

  return (
    <ScrollView style={s.c} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <Text style={s.logo}>LE POULET 🐔</Text>
      <Text style={s.stepLabel}>STEP {step} / {totalSteps}</Text>
      <View style={s.progress}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[s.progressDot, i < step && s.progressDotOn]} />
        ))}
      </View>

      {/* Step 1: Setup */}
      {step === 1 && (
        <View style={s.section}>
          <Text style={s.title}>Setup</Text>

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

          <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnTxt}>NEXT →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Players & Teams */}
      {step === 2 && (
        <View style={s.section}>
          <Text style={s.title}>Players & Teams</Text>

          <Text style={s.label}>How many players? <Text style={s.gold}>{playerCount}</Text></Text>
          <View style={s.pills}>
            {[4, 6, 8, 10, 12, 15, 20, 25, 30, 40].map((n) => (
              <TouchableOpacity key={n} onPress={() => setPlayerCount(n)} style={[s.pill, playerCount === n && s.pillOn]}>
                <Text style={[s.pillTxt, playerCount === n && s.pillTxtOn]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {suggestion && (
            <View style={s.suggestionBox}>
              <Text style={s.suggLabel}>SUGGESTED CONFIG</Text>
              <Text style={s.suggDesc}>{suggestion.description}</Text>
              <Text style={s.suggSub}>Based on {playerCount} players</Text>
            </View>
          )}

          <Text style={s.label}>Chickens 🐔</Text>
          <View style={s.pills}>
            {[1, 2, 3, 4].map((n) => (
              <TouchableOpacity key={n} onPress={() => setNumChickens(n)} style={[s.pill, numChickens === n && s.pillOn]}>
                <Text style={[s.pillTxt, numChickens === n && s.pillTxtOn]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Team Size</Text>
          <View style={s.pills}>
            {[2, 3, 4, 5, 6].map((n) => (
              <TouchableOpacity key={n} onPress={() => setTeamSize(n)} style={[s.pill, teamSize === n && s.pillOn]}>
                <Text style={[s.pillTxt, teamSize === n && s.pillTxtOn]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.dimTxt}>
            → ~{Math.max(1, Math.round((playerCount - numChickens) / teamSize))} team{Math.round((playerCount - numChickens) / teamSize) !== 1 ? "s" : ""}
          </Text>

          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backTxt}>← BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnFlex]} onPress={() => setStep(3)}>
              <Text style={s.btnTxt}>NEXT →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Buy-In */}
      {step === 3 && (
        <View style={s.section}>
          <Text style={s.title}>The Pot 💰</Text>
          <Text style={s.dimTxt}>Chicken uses buy-in for drinks while hiding. First team to find them drinks free.</Text>

          <Text style={s.label} style={{ marginTop: 16 }}>Buy-In Per Player</Text>
          <View style={s.pills}>
            {BUY_INS.map((b) => (
              <TouchableOpacity key={b} onPress={() => setBuyIn(b)} style={[s.pill, buyIn === b && s.pillOn]}>
                <Text style={[s.pillTxt, buyIn === b && s.pillTxtOn]}>{b === 0 ? "Free" : `$${b}`}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setBuyIn(-1)} style={[s.pill, buyIn === -1 && s.pillOn]}>
              <Text style={[s.pillTxt, buyIn === -1 && s.pillTxtOn]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {buyIn === -1 && (
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              placeholder="Enter amount ($)"
              placeholderTextColor="#8B7355"
              keyboardType="numeric"
              value={customBuyIn}
              onChangeText={setCustomBuyIn}
            />
          )}

          {pot > 0 && (
            <View style={s.potBox}>
              <Text style={s.potLabel}>ESTIMATED POT</Text>
              <Text style={s.potAmount}>${pot}</Text>
              <Text style={s.potSub}>{playerCount} players × ${buyIn === -1 ? (customBuyIn || "0") : buyIn}</Text>
            </View>
          )}

          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(2)}>
              <Text style={s.backTxt}>← BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnFlex]}
              onPress={() => { void fetchAreas(); setStep(4); }}
            >
              <Text style={s.btnTxt}>NEXT →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 4: Area + Launch */}
      {step === 4 && (
        <View style={s.section}>
          <Text style={s.title}>Best Areas 🍺</Text>
          <Text style={s.dimTxt}>Top neighbourhoods in {city} with the most bars close together.</Text>
          <Text style={s.dimTxt} style={{ marginTop: 4, fontSize: 11, color: "#8B7355" }}>
            The Chicken will pick their exact hiding bar once the game starts.
          </Text>

          {loadingAreas ? (
            <ActivityIndicator color="#F5C518" style={{ marginTop: 24 }} />
          ) : areas.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              {areas.map((area) => (
                <TouchableOpacity
                  key={area.name}
                  onPress={() => setSelectedArea(selectedArea?.name === area.name ? null : area)}
                  style={[s.areaRow, selectedArea?.name === area.name && s.areaRowOn]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.areaName, selectedArea?.name === area.name && { color: "#F5C518" }]}>
                      {area.name}
                    </Text>
                    <Text style={s.areaCount}>{area.bar_count} bars nearby</Text>
                  </View>
                  <Text style={s.areaArrow}>{selectedArea?.name === area.name ? "▾" : "▸"}</Text>
                </TouchableOpacity>
              ))}

              {selectedArea && (
                <View style={s.barList}>
                  <Text style={s.barListLabel}>BARS IN THIS AREA</Text>
                  {selectedArea.bars.slice(0, 8).map((bar) => (
                    <Text key={bar.id} style={s.barItem}>• {bar.name}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={s.noAreas}>
              <Text style={s.dimTxt}>Bar data not loaded. You can still continue — Chicken picks their bar in-game.</Text>
            </View>
          )}

          <View style={[s.navRow, { marginTop: 24 }]}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(3)}>
              <Text style={s.backTxt}>← BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnFlex, loading && s.btnOff]}
              onPress={() => void handleCreate()}
              disabled={loading}
            >
              <Text style={s.btnTxt}>{loading ? "Creating…" : "CREATE HUNT 🐔"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805" },
  content: { padding: 24, paddingBottom: 48 },
  logo: { fontSize: 28, fontWeight: "700", color: "#F5C518", textAlign: "center", letterSpacing: 4, marginBottom: 4 },
  stepLabel: { color: "#8B7355", textAlign: "center", fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  progress: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 28 },
  progressDot: { width: 28, height: 3, backgroundColor: "#3a3020" },
  progressDotOn: { backgroundColor: "#F5C518" },
  section: { gap: 0 },
  title: { fontSize: 40, fontWeight: "700", color: "#F5C518", marginBottom: 24, letterSpacing: 2 },
  label: { color: "#8B7355", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  gold: { color: "#F5C518" },
  input: { borderWidth: 1, borderColor: "#3a3020", color: "#F0EAD6", padding: 14, marginBottom: 8, fontSize: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  pill: { borderWidth: 1, borderColor: "#3a3020", paddingHorizontal: 16, paddingVertical: 8 },
  pillOn: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
  pillTxt: { color: "#8B7355", fontSize: 12, textTransform: "uppercase" },
  pillTxtOn: { color: "#0A0805", fontWeight: "700" },
  btn: { backgroundColor: "#F5C518", padding: 18, alignItems: "center", marginTop: 24 },
  btnFlex: { flex: 1, marginTop: 0 },
  btnOff: { opacity: 0.5 },
  btnTxt: { fontSize: 18, fontWeight: "700", color: "#0A0805", letterSpacing: 2 },
  backBtn: { borderWidth: 1, borderColor: "#3a3020", padding: 18, alignItems: "center", marginRight: 8 },
  backTxt: { color: "#8B7355", fontSize: 14, fontWeight: "600" },
  navRow: { flexDirection: "row", marginTop: 24 },
  suggestionBox: { backgroundColor: "#1a1612", borderWidth: 1, borderColor: "#F5C518", padding: 16, marginVertical: 12 },
  suggLabel: { color: "#8B7355", fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  suggDesc: { color: "#F5C518", fontSize: 16, fontWeight: "700" },
  suggSub: { color: "#8B7355", fontSize: 11, marginTop: 4 },
  dimTxt: { color: "#8B7355", fontSize: 12, lineHeight: 18 },
  potBox: { backgroundColor: "#1a1612", borderWidth: 1, borderColor: "#F5C518", padding: 20, alignItems: "center", marginTop: 16 },
  potLabel: { color: "#8B7355", fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  potAmount: { color: "#F5C518", fontSize: 40, fontWeight: "700" },
  potSub: { color: "#8B7355", fontSize: 12, marginTop: 4 },
  areaRow: { borderWidth: 1, borderColor: "#3a3020", padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  areaRowOn: { borderColor: "#F5C518", backgroundColor: "#1a1410" },
  areaName: { color: "#F0EAD6", fontSize: 16, fontWeight: "600" },
  areaCount: { color: "#8B7355", fontSize: 11, marginTop: 2 },
  areaArrow: { color: "#8B7355", fontSize: 16 },
  barList: { backgroundColor: "#1a1612", borderWidth: 1, borderColor: "#3a3020", padding: 12, marginBottom: 8 },
  barListLabel: { color: "#8B7355", fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  barItem: { color: "#F0EAD6", fontSize: 13, marginBottom: 4 },
  noAreas: { marginTop: 16 },
});
