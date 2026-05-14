"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import type { GameEvent } from "../types/events";

type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(gameId: string | null, playerId: string | null, baseUrl?: string) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const listeners = useRef<Set<(event: GameEvent) => void>>(new Set());

  const connect = useCallback(() => {
    if (!gameId || !playerId) return;
    const wsUrl = baseUrl ?? (typeof window !== "undefined" ? `ws://${window.location.hostname}:8000` : "ws://localhost:8000");
    const socket = new WebSocket(`${wsUrl}/ws/${gameId}/${playerId}`);
    ws.current = socket;
    setStatus("connecting");

    socket.onopen = () => setStatus("connected");
    socket.onclose = () => setStatus("disconnected");
    socket.onerror = () => setStatus("error");
    socket.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as GameEvent;
        listeners.current.forEach((cb) => cb(event));
      } catch (_) { /* ignore parse errors */ }
    };
  }, [gameId, playerId, baseUrl]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const send = useCallback((event: GameEvent) => {
    ws.current?.send(JSON.stringify(event));
  }, []);

  const subscribe = useCallback((cb: (event: GameEvent) => void) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  }, []);

  return { status, send, subscribe };
}
