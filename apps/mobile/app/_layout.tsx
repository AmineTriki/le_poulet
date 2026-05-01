import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0805" },
          headerTintColor: "#F5C518",
          headerTitleStyle: { fontSize: 20, fontWeight: "700" },
          contentStyle: { backgroundColor: "#0A0805" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/create" options={{ title: "Create Hunt" }} />
        <Stack.Screen name="game/join" options={{ title: "Join Hunt" }} />
        <Stack.Screen name="game/lobby/[code]" options={{ title: "Lobby" }} />
        <Stack.Screen name="game/hunt/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="game/chicken/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="game/challenge/[code]" options={{ title: "Challenge" }} />
        <Stack.Screen name="game/results/[code]" options={{ title: "Results" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
