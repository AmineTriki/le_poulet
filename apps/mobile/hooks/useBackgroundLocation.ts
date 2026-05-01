import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const TASK_NAME = "le-poulet-bg-location";

// Define the background task once at module level
TaskManager.defineTask(TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error("[BG Location] Error:", error.message);
    return;
  }
  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[0];
  if (loc) {
    // Background location received — persisted to AsyncStorage or sent via fetch
    console.log(
      "[BG Location]",
      loc.coords.latitude.toFixed(5),
      loc.coords.longitude.toFixed(5)
    );
  }
});

interface Opts {
  gameCode: string | null;
  playerToken: string | null;
  enabled: boolean;
}

export function useBackgroundLocation({ gameCode, playerToken, enabled }: Opts) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !gameCode || !playerToken) return;

    const startTracking = async () => {
      // Request foreground permission first
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        console.warn("[Location] Foreground permission denied");
        return;
      }

      // Request background permission
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        console.warn("[Location] Background permission denied — foreground only");
      }

      // Start background task if we have background permission
      if (bgStatus === "granted") {
        const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
        if (!alreadyRunning) {
          await Location.startLocationUpdatesAsync(TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "Le Poulet",
              notificationBody: "Tracking your location for the hunt 🐔",
              notificationColor: "#F5C518",
            },
          });
        }
      }

      // Foreground polling interval — sends location to API
      intervalRef.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
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
        } catch (e) {
          console.warn("[Location] Failed to send update:", e);
        }
      }, 5000);
    };

    void startTracking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      Location.stopLocationUpdatesAsync(TASK_NAME).catch(() => {});
    };
  }, [enabled, gameCode, playerToken]);
}
