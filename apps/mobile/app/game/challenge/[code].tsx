import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import CameraChallenge from "@/components/CameraChallenge";

export default function ChallengeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const handleSubmit = (_uri: string) => {
    router.back();
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <CameraChallenge
        challengeTitle="Complete the Challenge!"
        timeLimitSec={120}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
