export type ChallengeCategory = "social" | "physical" | "bar" | "creative" | "embarrassing" | "city";
export type ChallengeDifficulty = "easy" | "medium" | "hard";
export type MediaType = "photo" | "video";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Challenge {
  id: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  mediaType: MediaType;
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
  tags: string[];
  minPlayers: number;
  timeLimitSec: number;
}

export interface ChallengeSubmission {
  id: string;
  gameId: string;
  challengeId: string;
  teamId: string;
  playerId: string;
  mediaUrl: string | null;
  status: SubmissionStatus;
  pointsAwarded: number;
  chickenScore: number | null;
  submittedAt: string;
}
