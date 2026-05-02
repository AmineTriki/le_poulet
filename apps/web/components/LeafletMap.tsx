"use client";
import React, { useEffect, useRef, useState } from "react";

export interface PlayerMarker {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  name: string;
  color?: string;
  isMe?: boolean;
}

export interface CircleState {
  lat: number;
  lng: number;
  radiusM: number;
}

interface LeafletMapProps {
  center?: [number, number];
  isChicken?: boolean;
  players?: PlayerMarker[];
  circle?: CircleState | null;
  barLat?: number;
  barLng?: number;
  playerToken?: string;
}

export default function LeafletMap({
  center = [45.5017, -73.5673],
  isChicken = false,
  players = [],
  circle,
  barLat,
  barLng,
  playerToken,
}: LeafletMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const circleLayerRef = useRef<import("leaflet").Circle | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const init = async () => {
      const L = await import("leaflet");
      leafletRef.current = L;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenter: [number, number] =
        barLat && barLng ? [barLat, barLng] : center;
      const map = L.map(mapDivRef.current!, { center: initialCenter, zoom: 15 });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (barLat && barLng) {
        const barIcon = L.divIcon({
          html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.9))">🍺</div>`,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker([barLat, barLng], { icon: barIcon })
          .addTo(map)
          .bindPopup("<b>The Bar</b> — goal!");
      }

      setMapReady(true);
    };

    void init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        leafletRef.current = null;
        markersRef.current.clear();
        circleLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update circle
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;

    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
      circleLayerRef.current = null;
    }

    const src = circle ?? (barLat && barLng ? { lat: barLat, lng: barLng, radiusM: 1000 } : null);
    if (src) {
      circleLayerRef.current = L.circle([src.lat, src.lng], {
        radius: src.radiusM,
        color: "#F5C518",
        fillColor: "#F5C518",
        fillOpacity: 0.08,
        weight: 2,
        dashArray: isChicken ? "8 5" : undefined,
      }).addTo(map);
    }
  }, [mapReady, circle, barLat, barLng, isChicken]);

  // Update player markers
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const markers = markersRef.current;

    const currentIds = new Set(players.map((p) => p.id));

    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    for (const player of players) {
      const bg = player.color ?? (player.isMe ? "#F5C518" : "#8B7355");
      const border = player.isMe ? "2px solid #0A0805" : "1px solid rgba(0,0,0,0.5)";
      const icon = L.divIcon({
        html: `<div style="
          font-size:18px;line-height:1;text-align:center;
          background:${bg};border-radius:50%;width:34px;height:34px;
          display:flex;align-items:center;justify-content:center;
          border:${border};
          filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7));
          box-sizing:border-box;
        ">${player.emoji}</div>`,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const existing = markers.get(player.id);
      if (existing) {
        existing.setLatLng([player.lat, player.lng]);
      } else {
        const m = L.marker([player.lat, player.lng], { icon })
          .addTo(map)
          .bindTooltip(`${player.emoji} ${player.name}`, {
            permanent: player.isMe,
            direction: "top",
            offset: [0, -20],
          });
        markers.set(player.id, m);
      }
    }
  }, [mapReady, players]);

  // GPS reporting
  useEffect(() => {
    if (!playerToken || !navigator.geolocation) return;
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent < 5000) return;
        lastSent = now;
        void fetch(`${API}/api/v1/locations/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_token: playerToken,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed_ms: pos.coords.speed,
          }),
        });
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 3000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [playerToken]);

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapDivRef} className="w-full h-full" />
      {isChicken && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-poulet-black/90 border border-poulet-red px-4 py-2 font-mono text-poulet-red text-xs text-center whitespace-nowrap">
          🐔 Your location is hidden from hunters
        </div>
      )}
    </div>
  );
}
