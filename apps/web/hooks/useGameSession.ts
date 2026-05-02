export interface GameSession {
  gameCode: string;
  gameId: string;
  playerId: string;
  playerToken: string;
  isHost: boolean;
  hostToken?: string;
}

const KEY = "lepoulet_session";

export function saveSession(s: GameSession): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): GameSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
