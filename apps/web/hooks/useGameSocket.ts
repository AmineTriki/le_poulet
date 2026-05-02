"use client";
import { useEffect, useRef, useCallback } from "react";

export type WsMessage = Record<string, unknown>;
type Handler = (msg: WsMessage) => void;

export function useGameSocket(
  gameId: string | null,
  playerId: string | null,
  onMessage: Handler,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (!gameId || !playerId) return;
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const wsBase = API.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws/${gameId}/${playerId}`);
    wsRef.current = ws;

    ws.onmessage = (e: MessageEvent<string>) => {
      try {
        handlerRef.current(JSON.parse(e.data) as WsMessage);
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId, playerId]);

  return { send };
}
