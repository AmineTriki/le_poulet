import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../tokens/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, fullWidth, onPress, disabled, children }: ButtonProps) {
  const bg = variant === "primary" ? colors.pouletGold : variant === "danger" ? colors.pouletRed : "transparent";
  const textColor = variant === "primary" ? colors.pouletBlack : colors.pouletGold;
  const padding = size === "sm" ? 8 : size === "lg" ? 16 : 12;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        { backgroundColor: bg, padding, borderRadius: 4, alignItems: "center", justifyContent: "center" },
        fullWidth && { width: "100%" },
        (disabled || loading) && { opacity: 0.5 },
        variant === "secondary" && { borderWidth: 2, borderColor: colors.pouletGold },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: "700", textTransform: "uppercase" }}>
          {children as string}
        </Text>
      )}
    </TouchableOpacity>
  );
}
