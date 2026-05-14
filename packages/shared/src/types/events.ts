import type { GameConfig } from "./game";

export interface TeamScore {
  teamId: string;
  teamName: string;
  score: number;
  foundOrder: number | null;
}

export type WeaponType = "air_strike" | "spy" | "booby_trap" | "steal" | "decoy" | "silence";

export type GameEvent =
  | { type: "game:started"; config: GameConfig }
  | { type: "game:ended"; scoreboard: TeamScore[] }
  | { type: "player:joined"; playerId: string; name: string; emoji: string; gameId: string }
  | { type: "player:left"; playerId: string; gameId: string }
  | { type: "location:update"; playerId: string; lat: number; lng: number; ts: number }
  | { type: "circle:shrink"; lat: number; lng: number; radiusM: number; nextShrinkAt: number }
  | { type: "chicken:alert"; distanceM: number; teamId: string }
  | { type: "chicken:found"; teamId: string; teamName: string; order: number }
  | { type: "challenge:new"; challengeId: string; teamId: string; titleEn: string; titleFr: string; points: number; timeLimitSec: number }
  | { type: "challenge:submitted"; submissionId: string; teamId: string; challengeId: string; mediaUrl: string | null }
  | { type: "challenge:scored"; submissionId: string; teamId: string; points: number; approved: boolean }
  | { type: "weapon:fired"; weapon: WeaponType; byTeamId: string; targetTeamId: string | null }
  | { type: "weapon:hit"; weapon: WeaponType; effect: string; targetTeamId: string | null }
  | { type: "bar:marked"; barId: string; teamId: string; found: boolean };
