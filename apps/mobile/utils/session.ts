import AsyncStorage from '@react-native-async-storage/async-storage'

export interface GameSession {
  gameCode: string
  gameId: string
  playerId: string
  playerToken: string
  playerName: string
  playerEmoji: string
  isHost: boolean
  hostToken?: string
}

const KEY = '@lepoulet/session'

export async function saveSession(s: GameSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s))
}

export async function loadSession(): Promise<GameSession | null> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GameSession
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}
