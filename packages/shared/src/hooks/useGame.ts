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
    setLoading(true);
    apiClient
      .get<GameConfig>(API_ENDPOINTS.games.get(code))
      .then(setGame)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, [code]);

  return { game, loading, error };
}
