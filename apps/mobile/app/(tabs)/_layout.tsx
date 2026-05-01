import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#0A0805", borderTopColor: "#8B7355" },
        tabBarActiveTintColor: "#F5C518",
        tabBarInactiveTintColor: "#8B7355",
        headerStyle: { backgroundColor: "#0A0805" },
        headerTintColor: "#F5C518",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="hunt"
        options={{
          title: "Hunt",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
    </Tabs>
  );
}
