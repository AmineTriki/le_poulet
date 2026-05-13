import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASK_NAME = "le-poulet-bg-location";
const SESSION_KEY = "lepoulet_session";

// Background task — runs in a separate JS context; reads token from AsyncStorage
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[0];
  if (!loc) return;

  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw) as { playerToken?: string };
    if (!session.playerToken) return;

    const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
    await fetch(`${API}/api/v1/locations/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_token: session.playerToken,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy_m: loc.coords.accuracy ?? 0,
        heading: loc.coords.heading ?? null,
        speed_ms: loc.coords.speed ?? null,
      }),
    });
  } catch {
    // Background fetch failures are silent — connectivity may be intermittent
  }
});

interface Opts {
  playerToken: string | null;
  enabled: boolean;
}

export function useBackgroundLocation({ playerToken, enabled }: Opts) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !playerToken) return;

    const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

    const post = async (loc: Location.LocationObject) => {
      try {
        await fetch(`${API}/api/v1/locations/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_token: playerToken,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy_m: loc.coords.accuracy ?? 0,
            heading: loc.coords.heading ?? null,
            speed_ms: loc.coords.speed ?? null,
          }),
        });
      } catch {
        // Connectivity failures are silently dropped; next tick will retry
      }
    };

    const startTracking = async () => {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== "granted") return;

      // Foreground polling every 5 s
      intervalRef.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await post(loc);
        } catch {
          // GPS unavailable (simulator / no signal) — skip tick
        }
      }, 5_000);

      // Background task (physical device only)
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== "granted") return;

      const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
      if (!running) {
        await Location.startLocationUpdatesAsync(TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5_000,
          distanceInterval: 10,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Le Poulet",
            notificationBody: "Tracking your location for the hunt 🐔",
            notificationColor: "#F5C518",
          },
        });
      }
    };

    void startTracking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      Location.stopLocationUpdatesAsync(TASK_NAME).catch(() => {});
    };
  }, [enabled, playerToken]);
}
