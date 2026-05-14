import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GameSession {
  gameCode: string;
  gameId: string;
  playerId: string;
  playerToken: string;
  isHost: boolean;
  hostToken?: string;
}

const KEY = "lepoulet_session";

export async function saveSession(s: GameSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function loadSession(): Promise<GameSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
