import React from "react";
import { View } from "react-native";
import { colors } from "../../tokens/colors";

interface CardProps {
  children: React.ReactNode;
  gold?: boolean;
}

export function Card({ children, gold = false }: CardProps) {
  return (
    <View style={{
      backgroundColor: colors.pouletBlack,
      borderWidth: 1,
      borderColor: gold ? colors.pouletGold : colors.pouletFeather,
      padding: 16,
    }}>
      {children}
    </View>
  );
}
