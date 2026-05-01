export const typography = {
  fonts: {
    heading: "Bebas Neue, sans-serif",
    body: "Instrument Serif, serif",
    mono: "JetBrains Mono, monospace",
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    "2xl": 32,
    "3xl": 48,
    "4xl": 64,
    "5xl": 96,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    bold: "700" as const,
  },
} as const;
