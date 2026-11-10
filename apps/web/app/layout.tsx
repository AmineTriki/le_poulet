import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Poulet — City-Wide Chicken Hunt",
  description: "The free, chaotic, bilingual city-wide chicken hunt game. No app needed.",
  openGraph: {
    title: "Le Poulet — Hunt Your Friends",
    description: "The free, chaotic, bilingual city-wide chicken hunt game.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0805",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
