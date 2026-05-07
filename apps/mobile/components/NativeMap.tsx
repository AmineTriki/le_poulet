import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import Animated, { useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { loadSession } from "@/utils/session";

interface PlayerMarker {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  name: string;
  isMe?: boolean;
}

interface CircleState {
  lat: number;
  lng: number;
  radius: number;
}

interface NativeMapProps {
  gameCode: string;
  isChicken?: boolean;
}

export default function NativeMap({ gameCode, isChicken = false }: NativeMapProps) {
  const opacity = useSharedValue(0.15);
  const mapRef = useRef<MapView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const [circle, setCircle] = useState<CircleState>({ lat: 45.5017, lng: -73.5673, radius: 1500 });
  const [players, setPlayers] = useState<PlayerMarker[]>([]);
  const [danger, setDanger] = useState(false);
  const [proximityM, setProximityM] = useState<number | null>(null);

  const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
  const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 1200 }), withTiming(0.12, { duration: 1200 })),
      -1, false
    );
  }, [opacity]);

  // Load initial game state (circle center from bar location)
  const loadGameState = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/games/${gameCode}/state`);
      if (!r.ok) return;
      const data = (await r.json()) as {
        game: { bar_lat?: number; bar_lng?: number };
        players: { id: string; name: string; emoji: string; last_lat?: number; last_lng?: number }[];
        circle?: { center_lat: number; center_lng: number; radius_m: number };
      };
      if (data.circle) {
        setCircle({ lat: data.circle.center_lat, lng: data.circle.center_lng, radius: data.circle.radius_m });
      } else if (data.game.bar_lat && data.game.bar_lng) {
        setCircle((prev) => ({ ...prev, lat: data.game.bar_lat!, lng: data.game.bar_lng! }));
      }
      const markers: PlayerMarker[] = data.players
        .filter((p) => p.last_lat != null && p.last_lng != null)
        .map((p) => ({ id: p.id, lat: p.last_lat!, lng: p.last_lng!, emoji: p.emoji, name: p.name }));
      setPlayers(markers);
    } catch { /* silent */ }
  }, [gameCode, API]);

  // GPS tracking → send location updates to API
  const startTracking = useCallback(async (session: { gameId: string; playerId: string; playerToken: string }) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 5000, distanceInterval: 10 },
      async (loc) => {
        try {
          await fetch(`${API}/api/v1/locations/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              player_token: session.playerToken,
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy_m: loc.coords.accuracy ?? 0,
              heading: loc.coords.heading ?? 0,
              speed_ms: loc.coords.speed ?? 0,
            }),
          });
        } catch { /* silent */ }
      }
    );
  }, [API]);

  // WebSocket for live updates
  useEffect(() => {
    if (!gameCode) return;
    void (async () => {
      await loadGameState();
      const session = await loadSession();
      if (!session?.gameId || !session?.playerId) return;

      void startTracking(session);

      const ws = new WebSocket(`${WS_URL}/ws/${session.gameId}/${session.playerId}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as Record<string, unknown>;
          switch (msg.type) {
            case "location:update":
              setPlayers((prev) => {
                const id = msg.player_id as string;
                const updated = prev.filter((p) => p.id !== id);
                updated.push({
                  id,
                  lat: msg.lat as number,
                  lng: msg.lng as number,
                  emoji: (msg.emoji as string) ?? "🐔",
                  name: (msg.name as string) ?? "",
                });
                return updated;
              });
              break;
            case "circle:shrink":
              setCircle({ lat: msg.lat as number, lng: msg.lng as number, radius: msg.radius_m as number });
              break;
            case "chicken:alert":
              setDanger(true);
              setProximityM(msg.distance_m as number);
              setTimeout(() => setDanger(false), 5000);
              break;
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => ws.close();
    })();

    return () => {
      wsRef.current?.close();
      locationSubRef.current?.remove();
    };
  }, [gameCode, WS_URL, loadGameState, startTracking]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {isChicken && danger && (
        <View style={s.alertBanner}>
          <Text style={s.alertText}>⚠️ HUNTERS NEARBY — {proximityM != null ? `${Math.round(proximityM)}m` : "CLOSE"}</Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ latitude: circle.lat, longitude: circle.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        customMapStyle={darkMapStyle}
      >
        <Circle
          center={{ latitude: circle.lat, longitude: circle.lng }}
          radius={circle.radius}
          strokeColor={isChicken ? "#C1121F" : "#F5C518"}
          strokeWidth={2}
          fillColor={isChicken ? "rgba(193,18,31,0.08)" : "rgba(245,197,24,0.08)"}
        />
        {!isChicken && players.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name}>
            <View style={s.markerBox}><Text style={s.markerEmoji}>{p.emoji}</Text></View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const s = StyleSheet.create({
  alertBanner: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: "#C1121F", padding: 12,
  },
  alertText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  markerBox: { backgroundColor: "#0A0805", borderWidth: 1, borderColor: "#F5C518", borderRadius: 20, padding: 4 },
  markerEmoji: { fontSize: 18 },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8B7355" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0805" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2218" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
];
