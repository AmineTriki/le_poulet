import type { Config } from "tailwindcss";

const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        "poulet-black": "#0A0805",
        "poulet-gold": "#F5C518",
        "poulet-cream": "#F0EAD6",
        "poulet-red": "#C1121F",
        "poulet-green": "#2DC653",
        "poulet-feather": "#8B7355",
      },
      fontFamily: {
        heading: ["Bebas Neue", "sans-serif"],
        body: ["Instrument Serif", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        gold: "0 0 20px rgba(245, 197, 24, 0.4)",
        "gold-lg": "0 0 40px rgba(245, 197, 24, 0.6)",
        red: "0 0 20px rgba(193, 18, 31, 0.5)",
      },
      animation: {
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        feather: "feather 8s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        feather: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "0.6" },
          "50%": { transform: "translateY(-30px) rotate(15deg)", opacity: "0.9" },
          "100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.6" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
};

export default baseConfig;
