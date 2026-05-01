import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

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

  const [circle, setCircle] = React.useState<CircleState>({
    lat: 45.5017,
    lng: -73.5673,
    radius: 1000,
  });
  const [players, setPlayers] = React.useState<PlayerMarker[]>([]);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 1200 }),
        withTiming(0.12, { duration: 1200 })
      ),
      -1,
      false
    );
  }, [opacity]);

  // WebSocket connection for live updates
  useEffect(() => {
    if (!gameCode) return;
    const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";
    // WS connection would be established here with player token from storage
    // For now, we poll as fallback
    const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/v1/games/${gameCode}`);
        if (!r.ok) return;
      } catch {
        // silent fail
      }
    };
    void poll();
  }, [gameCode]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: circle.lat,
          longitude: circle.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        customMapStyle={darkMapStyle}
      >
        {/* Shrinking zone circle */}
        <Circle
          center={{ latitude: circle.lat, longitude: circle.lng }}
          radius={circle.radius}
          strokeColor={isChicken ? "#C1121F" : "#F5C518"}
          strokeWidth={2}
          fillColor={isChicken ? "rgba(193,18,31,0.08)" : "rgba(245,197,24,0.08)"}
        />

        {/* Player markers */}
        {players.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.name}
          />
        ))}
      </MapView>
    </View>
  );
}

// Dark map style for poulet-black aesthetic
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8B7355" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0805" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2218" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
];
