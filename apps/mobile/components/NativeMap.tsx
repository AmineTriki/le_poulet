import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export interface PlayerMarker {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  name: string;
  color?: string;
  isMe?: boolean;
}

export interface CircleState {
  lat: number;
  lng: number;
  radiusM: number;
}

interface NativeMapProps {
  players: PlayerMarker[];
  circle: CircleState | null;
  barLat?: number;
  barLng?: number;
  isChicken?: boolean;
  cityCenter?: { lat: number; lng: number };
}

const MONTREAL = { lat: 45.5017, lng: -73.5673 };

export default function NativeMap({
  players,
  circle,
  barLat,
  barLng,
  isChicken = false,
  cityCenter = MONTREAL,
}: NativeMapProps) {
  const mapRef = useRef<MapView>(null);
  const pulseOpacity = useSharedValue(0.15);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 1400 }),
        withTiming(0.10, { duration: 1400 }),
      ),
      -1,
      false,
    );
  }, [pulseOpacity]);

  // Re-center map when circle moves significantly
  useEffect(() => {
    if (!circle || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: circle.lat,
        longitude: circle.lng,
        latitudeDelta: Math.max(0.01, (circle.radiusM / 111_000) * 3),
        longitudeDelta: Math.max(0.01, (circle.radiusM / 111_000) * 3),
      },
      800,
    );
  }, [circle?.radiusM]); // eslint-disable-line react-hooks/exhaustive-deps

  const circleColor = isChicken ? "#C1121F" : "#F5C518";
  const circleFill = isChicken ? "rgba(193,18,31,0.07)" : "rgba(245,197,24,0.07)";

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: circle?.lat ?? cityCenter.lat,
          longitude: circle?.lng ?? cityCenter.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={DARK_MAP_STYLE}
      >
        {/* Shrinking zone */}
        {circle && (
          <Circle
            center={{ latitude: circle.lat, longitude: circle.lng }}
            radius={circle.radiusM}
            strokeColor={circleColor}
            strokeWidth={2}
            fillColor={circleFill}
          />
        )}

        {/* Bar marker — visible to hunters only when close */}
        {!isChicken && barLat != null && barLng != null && (
          <Marker
            coordinate={{ latitude: barLat, longitude: barLng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.barMarker}>
              <Text style={styles.barEmoji}>🍺</Text>
            </View>
          </Marker>
        )}

        {/* Player markers */}
        {players.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.playerBubble,
                p.isMe && styles.playerBubbleMe,
                p.color ? { borderColor: p.color } : undefined,
              ]}
            >
              <Text style={styles.playerEmoji}>{p.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  playerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#8B7355",
    backgroundColor: "rgba(10,8,5,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerBubbleMe: {
    borderColor: "#F5C518",
    borderWidth: 2.5,
  },
  playerEmoji: { fontSize: 18 },
  barMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,8,5,0.9)",
    borderWidth: 2,
    borderColor: "#F5C518",
    alignItems: "center",
    justifyContent: "center",
  },
  barEmoji: { fontSize: 20 },
});

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8B7355" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0805" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2218" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#342a1e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d3020" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1410" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16120e" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];
