import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Poulet — City-Wide Chicken Hunt",
  description: "The free, chaotic, bilingual city-wide chicken hunt game. No app needed.",
  metadataBase: new URL("https://lepoulet.vercel.app"),
  openGraph: {
    title: "Le Poulet — Hunt Your Friends",
    description: "The free, chaotic, bilingual city-wide chicken hunt game.",
    url: "https://lepoulet.vercel.app",
    images: [{ url: "/og-image.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
