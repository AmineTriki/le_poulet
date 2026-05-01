import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import NativeMap from "@/components/NativeMap";

export default function HuntScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <NativeMap gameCode={code ?? ""} />
    </View>
  );
}
