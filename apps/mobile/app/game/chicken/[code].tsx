import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, Animated as RNAnimated, StyleSheet,
  StatusBar, SafeAreaView, Vibration,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import NativeMap, { type CircleState } from "@/components/NativeMap";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";
import { useGameSocket, type WsMessage } from "@/hooks/useGameSocket";
import { loadSession } from "@/hooks/useSession";

const API = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

interface GameInfo {
  id: string;
  status: string;
  bar_lat: number | null;
  bar_lng: number | null;
  bar_name: string | null;
  head_start_ends_at: string | null;
  game_ends_at: string | null;
  city: string;
}

function useCountdown(isoTarget: string | null): string {
  const [display, setDisplay] = useState("--:--");
  useEffect(() => {
    if (!isoTarget) { setDisplay("--:--"); return; }
    const tick = () => {
      const diff = new Date(isoTarget).getTime() - Date.now();
      if (diff <= 0) { setDisplay("00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setDisplay(h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return display;
}

export default function ChickenScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [session, setSession] = useState<Awaited<ReturnType<typeof loadSession>>>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [dangerDist, setDangerDist] = useState<number | null>(null);
  const dangerAnim = useRef(new RNAnimated.Value(0)).current;

  const isHeadStart = game?.status === "head_start";
  const timerTarget = isHeadStart ? game?.head_start_ends_at : game?.game_ends_at;
  const timer = useCountdown(timerTarget ?? null);

  useEffect(() => { loadSession().then(setSession).catch(() => {}); }, []);

  useBackgroundLocation({
    playerToken: session?.playerToken ?? null,
    enabled: !!session?.playerToken,
  });

  // Fetch initial game state
  useEffect(() => {
    if (!code) return;
    const fetch_ = async () => {
      const res = await fetch(`${API()}/api/v1/games/${code}/state`);
      if (!res.ok) return;
      const data = await res.json() as {
        game: GameInfo;
        circle: { center_lat: number; center_lng: number; radius_m: number } | null;
      };
      setGame(data.game);
      if (data.circle) {
        setCircle({ lat: data.circle.center_lat, lng: data.circle.center_lng, radiusM: data.circle.radius_m });
      }
    };
    void fetch_();
  }, [code]);

  // Animate danger alert in/out
  const triggerDanger = useCallback((dist: number) => {
    setDangerDist(dist);
    Vibration.vibrate([0, 200, 100, 200]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    RNAnimated.sequence([
      RNAnimated.timing(dangerAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      RNAnimated.delay(3_000),
      RNAnimated.timing(dangerAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setDangerDist(null));
  }, [dangerAnim]);

  const handleWs = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "circle:shrink":
        setCircle({ lat: msg.lat as number, lng: msg.lng as number, radiusM: msg.radius_m as number });
        break;
      case "chicken:alert":
        triggerDanger(msg.distance_m as number);
        break;
      case "game:started":
        setGame((g) => g ? { ...g, status: "active" } : g);
        break;
      case "game:ended":
        router.replace(`/game/results/${code as string}`);
        break;
    }
  }, [code, triggerDanger]);

  useGameSocket(game?.id ?? null, session?.playerId ?? null, handleWs);

  const dangerOpacity = dangerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0805" />

      <NativeMap players={[]} circle={circle} isChicken />

      {/* Top HUD */}
      <SafeAreaView style={s.topHud} pointerEvents="box-none">
        <View style={s.topBar}>
          <View style={s.chickenBadge}>
            <Text style={s.chickenBadgeText}>🐔 YOU ARE THE CHICKEN</Text>
          </View>
          <Text style={s.timer}>{timer}</Text>
        </View>
        {isHeadStart && (
          <View style={s.headStartBanner}>
            <Text style={s.headStartText}>Head start — get to a bar and stay hidden</Text>
          </View>
        )}
        {game?.bar_name && !isHeadStart && (
          <View style={s.barBanner}>
            <Text style={s.barBannerText}>📍 {game.bar_name}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Danger alert overlay */}
      <RNAnimated.View
        style={[s.dangerOverlay, { opacity: dangerOpacity }]}
        pointerEvents="none"
      >
        <Text style={s.dangerEmoji}>⚠️</Text>
        <Text style={s.dangerTitle}>HUNTER NEARBY</Text>
        {dangerDist != null && (
          <Text style={s.dangerDist}>{Math.round(dangerDist)} m away</Text>
        )}
        <Text style={s.dangerSub}>Stay calm. Don't move.</Text>
      </RNAnimated.View>

      {/* Status bar at bottom */}
      <View style={s.bottomBar}>
        {isHeadStart ? (
          <Text style={s.bottomText}>🏃 Find a bar before the timer ends</Text>
        ) : (
          <Text style={s.bottomText}>🙈 Stay hidden — hunters are coming</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0805" },

  topHud: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
    backgroundColor: "rgba(193,18,31,0.90)",
  },
  chickenBadge: {},
  chickenBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  timer: { fontFamily: "monospace", fontSize: 20, fontWeight: "700", color: "#fff" },
  headStartBanner: {
    backgroundColor: "rgba(10,8,5,0.85)", paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(193,18,31,0.4)",
  },
  headStartText: { color: "#F0EAD6", fontSize: 13, textAlign: "center", fontStyle: "italic" },
  barBanner: {
    backgroundColor: "rgba(10,8,5,0.85)", paddingVertical: 8, paddingHorizontal: 16,
  },
  barBannerText: { color: "#F5C518", fontSize: 13, textAlign: "center", fontFamily: "monospace" },

  dangerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(193,18,31,0.85)",
    alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  dangerEmoji: { fontSize: 64, marginBottom: 12 },
  dangerTitle: { fontSize: 36, fontWeight: "700", color: "#fff", letterSpacing: 3, marginBottom: 8 },
  dangerDist: { fontSize: 22, color: "#fff", fontFamily: "monospace", marginBottom: 8 },
  dangerSub: { fontSize: 16, color: "rgba(255,255,255,0.7)", fontStyle: "italic" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 80,
    backgroundColor: "rgba(10,8,5,0.9)", borderTopWidth: 1,
    borderTopColor: "rgba(193,18,31,0.3)", paddingVertical: 16, paddingBottom: 36,
  },
  bottomText: { color: "#8B7355", textAlign: "center", fontStyle: "italic", fontSize: 14 },
});
