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
  barName?: string;
  playerToken?: string;
}

export default function LeafletMap({
  center = [45.5017, -73.5673],
  isChicken = false,
  players = [],
  circle,
  barLat,
  barLng,
  barName,
  playerToken,
}: LeafletMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const circleLayerRef = useRef<import("leaflet").Circle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [nearestDist, setNearestDist] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const init = async () => {
      const L = await import("leaflet");
      leafletRef.current = L;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const initialCenter: [number, number] =
        barLat && barLng ? [barLat, barLng] : center;

      const map = L.map(mapDivRef.current!, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
      });
      mapRef.current = map;

      // CartoDB Dark Matter tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Bar marker
      if (barLat && barLng) {
        const barIcon = L.divIcon({
          html: `<div style="
            font-size:0;
            width:36px;height:44px;
            display:flex;flex-direction:column;align-items:center;
            filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));
          ">
            <div style="
              background:#F5C518;border-radius:50% 50% 50% 0;
              width:32px;height:32px;transform:rotate(-45deg);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="font-size:18px;transform:rotate(45deg);line-height:1;">🍺</span>
            </div>
            <div style="width:2px;height:10px;background:#F5C518;"></div>
          </div>`,
          className: "",
          iconSize: [36, 44],
          iconAnchor: [18, 44],
        });
        L.marker([barLat, barLng], { icon: barIcon })
          .addTo(map)
          .bindPopup(`<b style="color:#0A0805">${barName ?? "The Bar"}</b><br/><span style="color:#555">Goal — find the chicken here!</span>`);
      }

      // Scale control
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

      // Re-center button
      const CenterBtn = L.Control.extend({
        onAdd: () => {
          const btn = L.DomUtil.create("button", "");
          btn.innerHTML = "📍";
          btn.title = "Center on me";
          Object.assign(btn.style, {
            background: "#0A0805", border: "1px solid #F5C518",
            color: "#F5C518", width: "32px", height: "32px",
            cursor: "pointer", fontSize: "16px", borderRadius: "2px",
          });
          L.DomEvent.on(btn, "click", () => {
            navigator.geolocation?.getCurrentPosition((pos) => {
              map.setView([pos.coords.latitude, pos.coords.longitude], 16);
            });
          });
          return btn;
        },
      });
      new CenterBtn({ position: "topright" }).addTo(map);

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

  // Update circle — gold gradient with pulse on shrink
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
        fillOpacity: 0.06,
        weight: 2,
        dashArray: isChicken ? "10 6" : undefined,
        opacity: 0.9,
      }).addTo(map);

      // Distance from bar to nearest player
      if (players.length > 0 && barLat && barLng) {
        const dists = players.map((p) => {
          const R = 6371000;
          const dLat = (p.lat - barLat) * Math.PI / 180;
          const dLng = (p.lng - barLng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(barLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        });
        const minDist = Math.min(...dists);
        setNearestDist(minDist < 1000 ? `${Math.round(minDist)}m` : `${(minDist / 1000).toFixed(1)}km`);
      }
    }
  }, [mapReady, circle, barLat, barLng, isChicken, players]);

  // Update player markers — larger, team-colored, name tooltip
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const markers = markersRef.current;

    const currentIds = new Set(players.map((p) => p.id));
    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) { marker.remove(); markers.delete(id); }
    }

    for (const player of players) {
      const bg = player.color ?? (player.isMe ? "#F5C518" : "#6B5C3E");
      const ring = player.isMe ? `box-shadow:0 0 0 3px #F5C518,0 0 0 5px rgba(245,197,24,0.3);` : "";
      const size = player.isMe ? 40 : 34;

      const icon = L.divIcon({
        html: `<div style="
          font-size:20px;line-height:1;text-align:center;
          background:${bg};border-radius:50%;
          width:${size}px;height:${size}px;
          display:flex;align-items:center;justify-content:center;
          border:2px solid rgba(0,0,0,0.6);
          filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));
          box-sizing:border-box;${ring}
        ">${player.emoji}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
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
            offset: [0, -(size / 2 + 4)],
            className: "leaflet-tooltip-dark",
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
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-tooltip-dark {
          background: rgba(10,8,5,0.9);
          border: 1px solid rgba(245,197,24,0.4);
          color: #F0EAD6;
          font-family: monospace;
          font-size: 11px;
          padding: 2px 6px;
          box-shadow: none;
        }
        .leaflet-tooltip-dark::before { border-top-color: rgba(245,197,24,0.4); }
        .leaflet-control-scale-line {
          background: rgba(10,8,5,0.7);
          border-color: #F5C518;
          color: #F0EAD6;
          font-size: 10px;
        }
      `}</style>
      <div ref={mapDivRef} className="w-full h-full" />
      {isChicken && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-poulet-black/90 border border-poulet-red px-4 py-2 font-mono text-poulet-red text-xs text-center whitespace-nowrap">
          🐔 Your location is hidden from hunters
        </div>
      )}
      {nearestDist && barName && !isChicken && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-poulet-black/90 border border-poulet-feather/30 px-3 py-1.5">
          <div className="font-mono text-poulet-feather text-xs">📍 {barName}</div>
          <div className="font-mono text-poulet-gold text-xs">{nearestDist} from closest hunter</div>
        </div>
      )}
    </div>
  );
}
