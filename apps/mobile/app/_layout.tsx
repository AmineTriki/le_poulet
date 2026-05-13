import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { loadSession, clearSession } from "@/hooks/useSession";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function SessionGuard() {
  usePushNotifications();

  useEffect(() => {
    const resumeSession = async () => {
      const session = await loadSession().catch(() => null);
      if (!session) return;

      const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
      try {
        const res = await fetch(`${API}/api/v1/games/${session.gameCode}`);
        if (!res.ok) { await clearSession(); return; }
        const g = await res.json() as { status: string };

        if (g.status === "ended") { await clearSession(); return; }

        if (g.status === "lobby") {
          router.replace(`/game/lobby/${session.gameCode}`);
          return;
        }

        if (g.status === "head_start" || g.status === "active") {
          const pr = await fetch(`${API}/api/v1/players/me/${session.playerToken}`);
          if (!pr.ok) { await clearSession(); return; }
          const p = await pr.json() as { role: string };
          router.replace(
            p.role === "chicken"
              ? `/game/chicken/${session.gameCode}`
              : `/game/hunt/${session.gameCode}`,
          );
        }
      } catch {
        // API unreachable — stay on home, do not clear session
      }
    };

    // Slight delay so navigator is mounted before we push
    const t = setTimeout(() => void resumeSession(), 150);
    return () => clearTimeout(t);
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SessionGuard />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0805" },
          headerTintColor: "#F5C518",
          headerTitleStyle: { fontSize: 18, fontWeight: "700", letterSpacing: 1 },
          contentStyle: { backgroundColor: "#0A0805" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/create" options={{ title: "Create Hunt" }} />
        <Stack.Screen name="game/join" options={{ title: "Join Hunt" }} />
        <Stack.Screen name="game/lobby/[code]" options={{ title: "Lobby", headerBackVisible: false }} />
        <Stack.Screen name="game/hunt/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="game/chicken/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="game/challenge/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="game/results/[code]" options={{ title: "Results", headerBackVisible: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
