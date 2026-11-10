"use client";
import { useEffect, useRef, useCallback, useState } from "react";

export type WsMessage = Record<string, unknown>;
export type WsStatus = "connecting" | "open" | "reconnecting";
type Handler = (msg: WsMessage) => void;

export function useGameSocket(
  gameId: string | null,
  playerId: string | null,
  onMessage: Handler,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;
  const [status, setStatus] = useState<WsStatus>("connecting");

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (!gameId || !playerId) return;
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const wsBase = API.replace(/^http/, "ws");
    let disposed = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? "connecting" : "reconnecting");
      const ws = new WebSocket(`${wsBase}/ws/${gameId}/${playerId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setStatus("open");
      };

      ws.onmessage = (e: MessageEvent<string>) => {
        try {
          handlerRef.current(JSON.parse(e.data) as WsMessage);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (disposed) return;
        // Phones drop sockets when backgrounded or offline: retry with capped backoff.
        setStatus("reconnecting");
        const delay = Math.min(1000 * 2 ** attempt, 15_000);
        attempt += 1;
        timer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [gameId, playerId]);

  return { send, status };
}
