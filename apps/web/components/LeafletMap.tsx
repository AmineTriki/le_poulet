"use client";
import React, { useEffect, useRef } from "react";

interface LeafletMapProps {
  gameCode: string;
  isChicken?: boolean;
}

export default function LeafletMap({ gameCode, isChicken = false }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { center: [45.5017, -73.5673], zoom: 14 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const circle = L.circle([45.5017, -73.5673], {
        radius: 1000,
        color: "#F5C518",
        fillColor: "#F5C518",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: isChicken ? "6 4" : undefined,
      }).addTo(map);

      mapInstance.current = map;

      // Heartbeat pulse
      let growing = false;
      const pulse = setInterval(() => {
        const r = (circle as { getRadius: () => number }).getRadius();
        growing ? (circle as { setRadius: (n: number) => void }).setRadius(r + 4) : (circle as { setRadius: (n: number) => void }).setRadius(r - 4);
        if (r >= 1024) growing = false;
        if (r <= 990) growing = true;
      }, 80);

      return () => clearInterval(pulse);
    };

    void initMap();

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, [isChicken]);

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
      {isChicken && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-poulet-red/90 border border-poulet-red px-4 py-2 font-mono text-white text-xs text-center">
          🐔 You are the Chicken — your location is hidden from hunters
        </div>
      )}
    </div>
  );
}
