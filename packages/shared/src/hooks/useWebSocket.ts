"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import type { GameEvent } from "../types/events";

type WSStatus = "connecting" | "connected" | "disconnected" | "error";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

export function useWebSocket(gameId: string | null, playerId: string | null, baseUrl?: string) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const listeners = useRef<Set<(event: GameEvent) => void>>(new Set());

  useEffect(() => {
    if (!gameId || !playerId) return;

    // `disposed` guards every async callback against running after cleanup
    // (or after gameId/playerId changed), so a stale socket can never flip
    // status or schedule a reconnect.
    let disposed = false;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const wsUrl =
      baseUrl ??
      (typeof window !== "undefined" ? `ws://${window.location.hostname}:8000` : "ws://localhost:8000");

    const open = () => {
      setStatus("connecting");
      const s = new WebSocket(`${wsUrl}/ws/${gameId}/${playerId}`);
      socket = s;
      ws.current = s;

      s.onopen = () => {
        if (disposed) return;
        attempts = 0;
        setStatus("connected");
      };
      s.onerror = () => {
        if (!disposed) setStatus("error");
      };
      s.onclose = () => {
        if (disposed) return;
        setStatus("disconnected");
        // Unexpected close: reconnect with capped exponential backoff.
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempts, RECONNECT_MAX_MS);
        attempts += 1;
        retryTimer = setTimeout(open, delay);
      };
      s.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data as string) as GameEvent;
          listeners.current.forEach((cb) => cb(event));
        } catch {
          /* ignore parse errors */
        }
      };
    };

    open();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.onopen = socket.onerror = socket.onclose = socket.onmessage = null;
        socket.close();
      }
      if (ws.current === socket) ws.current = null;
    };
  }, [gameId, playerId, baseUrl]);

  const send = useCallback((event: GameEvent) => {
    const s = ws.current;
    // send() throws InvalidStateError while CONNECTING; drop instead.
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify(event));
  }, []);

  const subscribe = useCallback((cb: (event: GameEvent) => void) => {
    listeners.current.add(cb);
    return () => {
      listeners.current.delete(cb);
    };
  }, []);

  return { status, send, subscribe };
}
