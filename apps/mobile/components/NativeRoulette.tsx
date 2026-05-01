import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = width - 48;

interface Player {
  name: string;
  emoji: string;
}

interface Props {
  players: Player[];
  onResult: (p: Player) => void;
}

const SEGMENT_COLORS = ["#F5C518", "#C1121F", "#2DC653", "#457B9D", "#8B7355", "#F0EAD6"];

export default function NativeRoulette({ players, onResult }: Props) {
  const rot = useSharedValue(0);
  const isSpinning = useSharedValue(false);

  const deliverResult = useCallback(
    (currentAngle: number) => {
      if (players.length === 0) return;
      const seg = 360 / players.length;
      const norm = ((currentAngle % 360) + 360) % 360;
      const idx = Math.floor((360 - norm) / seg) % players.length;
      const winner = players[idx];
      if (winner) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onResult(winner);
      }
      isSpinning.value = false;
    },
    [players, onResult, isSpinning]
  );

  const spin = useCallback(
    (fast: boolean) => {
      if (isSpinning.value) return;
      isSpinning.value = true;

      const extraSpins = fast ? 2 : 5 + Math.random() * 4;
      const extraAngle = extraSpins * 360 + Math.random() * 360;
      const duration = fast ? 900 : 8000 + Math.random() * 3000;

      rot.value = withTiming(
        rot.value + extraAngle,
        { duration, easing: Easing.out(Easing.cubic) },
        (done) => {
          if (done) {
            runOnJS(deliverResult)(rot.value);
          }
        }
      );
    },
    [rot, isSpinning, deliverResult]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  if (players.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTxt}>Add players to spin the roulette</Text>
      </View>
    );
  }

  const segmentAngle = 360 / players.length;

  return (
    <View style={s.c}>
      {/* Pointer */}
      <View style={s.pointer} />

      {/* Wheel */}
      <Animated.View style={[s.wheel, animatedStyle]}>
        {players.map((p, i) => (
          <View
            key={i}
            style={[
              s.seg,
              {
                transform: [{ rotate: `${i * segmentAngle}deg` }],
                backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
              },
            ]}
          >
            <Text style={s.segTxt} numberOfLines={1}>
              {p.emoji} {p.name}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Buttons */}
      <View style={s.btns}>
        <TouchableOpacity style={s.slow} onPress={() => spin(false)}>
          <Text style={s.slowTxt}>SPIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.fast} onPress={() => spin(true)}>
          <Text style={s.fastTxt}>FAST ⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { alignItems: "center", padding: 24 },
  empty: { padding: 40, alignItems: "center" },
  emptyTxt: { color: "#8B7355", fontStyle: "italic" },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F5C518",
    zIndex: 10,
    marginBottom: -10,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#F5C518",
  },
  seg: {
    position: "absolute",
    width: "50%",
    height: "50%",
    right: "50%",
    bottom: "50%",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 6,
    transformOrigin: "bottom right",
  },
  segTxt: { fontSize: 10, fontWeight: "700", color: "#0A0805", maxWidth: 60 },
  btns: { flexDirection: "row", gap: 12, marginTop: 28 },
  slow: {
    backgroundColor: "#F5C518",
    paddingHorizontal: 32,
    paddingVertical: 16,
    flex: 1,
    alignItems: "center",
  },
  slowTxt: { color: "#0A0805", fontWeight: "700", fontSize: 16, letterSpacing: 2 },
  fast: {
    borderWidth: 2,
    borderColor: "#F5C518",
    paddingHorizontal: 32,
    paddingVertical: 16,
    flex: 1,
    alignItems: "center",
  },
  fastTxt: { color: "#F5C518", fontWeight: "700", fontSize: 16 },
});
