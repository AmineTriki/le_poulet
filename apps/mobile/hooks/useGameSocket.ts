import { useEffect, useRef, useCallback } from "react";

export type WsMessage = Record<string, unknown>;

export function useGameSocket(
  gameId: string | null,
  playerId: string | null,
  onMessage: (msg: WsMessage) => void,
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

    const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";
    const url = `${WS_URL}/ws/${gameId}/${playerId}`;
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onmessage = (e: MessageEvent<string>) => {
      try {
        handlerRef.current(JSON.parse(e.data) as WsMessage);
      } catch {
        // ignore malformed frames
      }
    };

    // Keep-alive: server pings every 30s; re-echo to stay alive
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "ping" }));
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [gameId, playerId]);

  return { send };
}
