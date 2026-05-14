import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import CameraChallenge from "@/components/CameraChallenge";
import { loadSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

interface Challenge {
  id: string;
  title_en: string;
  title_fr: string;
  desc_en: string;
  desc_fr: string;
  points: number;
  time_limit_sec: number;
  category: string;
}

export default function ChallengeScreen() {
  // params: code = game code, teamId passed as query param
  const { code, teamId } = useLocalSearchParams<{ code: string; teamId: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [lang, setLang] = useState("en");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const session = await loadSession();
      if (!session) { router.back(); return; }
      setPlayerToken(session.playerToken);

      // Fetch game info for language
      const gr = await fetch(`${API()}/api/v1/games/${code}`);
      if (!gr.ok) { router.back(); return; }
      const g = await gr.json() as { id: string; language: string };
      setGameId(g.id);
      setLang(g.language);

      // Fetch random challenge for this team
      const resolvedTeamId = teamId ?? session.playerId; // fallback
      const cr = await fetch(`${API()}/api/v1/challenges/random/${g.id}/${resolvedTeamId}?city=montreal`);
      if (cr.ok) {
        setChallenge(await cr.json() as Challenge);
      } else {
        setError("No challenges available right now.");
      }
      setLoading(false);
    };
    void init();
  }, [code, teamId]);

  const handleSubmit = async (mediaUri: string) => {
    if (!challenge || !playerToken || !gameId || !teamId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API()}/api/v1/challenges/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          challenge_id: challenge.id,
          team_id: teamId,
          player_token: playerToken,
          media_url: mediaUri, // local URI for now; swap for upload URL when storage is configured
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
      // Return to hunt after brief confirmation
      setTimeout(() => router.back(), 1_500);
    } catch {
      setError("Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#F5C518" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorEmoji}>😕</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={s.center}>
        <Text style={s.doneEmoji}>✅</Text>
        <Text style={s.doneTitle}>CHALLENGE DONE!</Text>
        <Text style={s.doneSub}>+{challenge?.points} pts pending approval</Text>
      </View>
    );
  }

  if (!challenge) return null;

  return (
    <CameraChallenge
      challengeTitle={lang === "fr" ? challenge.title_fr : challenge.title_en}
      challengeDesc={lang === "fr" ? challenge.desc_fr : challenge.desc_en}
      points={challenge.points}
      timeLimitSec={challenge.time_limit_sec}
      submitting={submitting}
      onSubmit={(uri) => void handleSubmit(uri)}
      onCancel={() => router.back()}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#0A0805", alignItems: "center", justifyContent: "center", padding: 24 },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorText: { color: "#C1121F", fontSize: 16, textAlign: "center", marginBottom: 24 },
  backBtn: { borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: "#F5C518", fontFamily: "monospace", fontSize: 14, letterSpacing: 1 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: "700", color: "#F5C518", letterSpacing: 2 },
  doneSub: { color: "#8B7355", marginTop: 8, fontFamily: "monospace", fontSize: 13 },
});
