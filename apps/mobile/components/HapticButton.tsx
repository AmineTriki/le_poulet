import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";

interface Props {
  onPress: () => void;
  children: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export default function HapticButton({
  onPress,
  children,
  variant = "primary",
  disabled,
  loading,
}: Props) {
  const handle = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        s.btn,
        variant === "secondary" && s.sec,
        variant === "danger" && s.danger,
        isDisabled && s.off,
      ]}
      onPress={handle}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0A0805" : "#F5C518"} />
      ) : (
        <Text
          style={[
            s.txt,
            variant === "secondary" && s.secTxt,
            variant === "danger" && s.dangerTxt,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: "#F5C518", padding: 16, alignItems: "center" },
  sec: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#F5C518" },
  danger: { backgroundColor: "#C1121F", borderWidth: 0 },
  off: { opacity: 0.4 },
  txt: { color: "#0A0805", fontWeight: "700", fontSize: 16, textTransform: "uppercase", letterSpacing: 2 },
  secTxt: { color: "#F5C518" },
  dangerTxt: { color: "#FFFFFF" },
});
