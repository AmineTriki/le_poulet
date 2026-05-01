export type PlayerRole = "hunter" | "chicken" | "host";

export interface Player {
  id: string;
  gameId: string;
  teamId: string | null;
  name: string;
  emoji: string;
  role: PlayerRole;
  isOnline: boolean;
  score: number;
  lastLat: number | null;
  lastLng: number | null;
  token: string;
  createdAt: string;
}
