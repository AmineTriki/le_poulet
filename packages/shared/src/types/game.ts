export type GameStatus = "lobby" | "head_start" | "active" | "ended";
export type CostumePolicy = "required" | "encouraged" | "optional" | "none";
export type Language = "en" | "fr";

export interface GameConfig {
  id: string;
  code: string;
  name: string;
  city: string;
  language: Language;
  status: GameStatus;
  numChickens: number;
  headStartMinutes: number;
  gameDurationHours: number;
  teamSize: number;
  gpsShrinkIntervalMinutes: number;
  buyInAmount: number;
  costumePolicy: CostumePolicy;
  chaosMode: boolean;
  allowCalls: boolean;
  allowTexts: boolean;
  allowHints: boolean;
  allowSocialMedia: boolean;
  barName: string | null;
  barLat: number | null;
  barLng: number | null;
  headStartEndsAt: string | null;
  gameEndsAt: string | null;
  createdAt: string;
  playerCount: number;
  teamCount: number;
}

export interface Bar {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  houseNumber: string;
  phone: string;
  website: string;
  openingHours: string;
  distanceM?: number;
}

export interface CircleState {
  centerLat: number;
  centerLng: number;
  radiusM: number;
  nextShrinkAt: string | null;
  shrinkCount: number;
}
