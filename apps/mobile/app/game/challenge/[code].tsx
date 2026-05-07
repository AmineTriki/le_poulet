import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import CameraChallenge from "@/components/CameraChallenge";
import { loadSession } from "@/utils/session";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  time_limit_seconds: number;
}

export default function ChallengeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    void (async () => {
      const session = await loadSession();
      if (!session) { setLoading(false); return; }
      try {
        const r = await fetch(
          `${API}/api/v1/challenges/random/${session.gameId}/${session.playerId}?city=montreal`
        );
        if (r.ok) setChallenge((await r.json()) as Challenge);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [API]);

  const handleSubmit = async (uri: string) => {
    const session = await loadSession();
    if (!session || !challenge) { router.back(); return; }
    try {
      await fetch(`${API}/api/v1/challenges/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_token: session.playerToken,
          challenge_id: challenge.id,
          media_url: uri,
        }),
      });
      setSubmitted(true);
      setTimeout(() => router.back(), 2000);
    } catch {
      setError("Failed to submit. Try again.");
    }
  };

  if (submitted) {
    return (
      <View style={s.center}>
        <Text style={s.big}>✅</Text>
        <Text style={s.title}>Submitted!</Text>
        <Text style={s.sub}>+{challenge?.points ?? 0} pts if approved</Text>
      </View>
    );
  }

  if (loading) {
    return <View style={s.center}><Text style={s.sub}>Loading challenge…</Text></View>;
  }

  if (!challenge) {
    return (
      <View style={s.center}>
        <Text style={s.title}>No challenge available</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.back()}>
          <Text style={s.btnTxt}>BACK TO MAP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {error ? (
        <View style={s.errBanner}><Text style={s.errTxt}>{error}</Text></View>
      ) : null}
      <CameraChallenge
        challengeTitle={`${challenge.title} (+${challenge.points} pts)`}
        timeLimitSec={challenge.time_limit_seconds ?? 120}
        onSubmit={(uri) => void handleSubmit(uri)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#0A0805", justifyContent: "center", alignItems: "center", padding: 24 },
  big: { fontSize: 64, marginBottom: 16 },
  title: { color: "#F5C518", fontSize: 28, fontWeight: "700", marginBottom: 8 },
  sub: { color: "#8B7355", fontSize: 14 },
  btn: { marginTop: 24, backgroundColor: "#F5C518", paddingHorizontal: 32, paddingVertical: 14 },
  btnTxt: { color: "#0A0805", fontWeight: "700", fontSize: 16 },
  errBanner: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "#C1121F", padding: 10 },
  errTxt: { color: "white", textAlign: "center", fontSize: 12 },
});
