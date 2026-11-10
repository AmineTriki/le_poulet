"use client";
import { useState, useEffect } from "react";
import type { GameConfig } from "../types/game";
import { apiClient } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

export function useGame(code: string | null) {
  const [game, setGame] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    // Ignore responses that arrive after `code` changed or the component unmounted.
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<GameConfig>(API_ENDPOINTS.games.get(code))
      .then((g) => {
        if (!cancelled) setGame(g);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return { game, loading, error };
}
