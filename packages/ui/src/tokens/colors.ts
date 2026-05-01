export const colors = {
  pouletBlack: "#0A0805",
  pouletGold: "#F5C518",
  pouletCream: "#F0EAD6",
  pouletRed: "#C1121F",
  pouletGreen: "#2DC653",
  pouletFeather: "#8B7355",
  white: "#FFFFFF",
  transparent: "transparent",
  overlay: "rgba(10, 8, 5, 0.6)",
  goldOpacity15: "rgba(245, 197, 24, 0.15)",
} as const;

export type ColorKey = keyof typeof colors;
