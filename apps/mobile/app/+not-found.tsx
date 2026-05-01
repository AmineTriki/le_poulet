import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={s.c}>
        <Text style={s.emoji}>🐔</Text>
        <Text style={s.t}>The Chicken Escaped</Text>
        <Text style={s.sub}>This page doesn't exist.</Text>
        <Link href="/" style={s.link}>Go home</Link>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0A0805", justifyContent: "center", alignItems: "center", padding: 24 },
  emoji: { fontSize: 64, marginBottom: 16 },
  t: { fontSize: 28, fontWeight: "700", color: "#F5C518", marginBottom: 8 },
  sub: { color: "#8B7355", marginBottom: 24 },
  link: { color: "#F5C518", borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 20, paddingVertical: 10 },
});
