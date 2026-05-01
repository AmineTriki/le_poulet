export const FIND_BONUS: Record<number, number> = {
  1: 100,
  2: 75,
  3: 50,
};

export function getFindBonus(order: number): number {
  return FIND_BONUS[order] ?? 0;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function calculateTotalPot(buyIn: number, playerCount: number): number {
  return buyIn * playerCount;
}

export function formatPot(amount: number, currency: string = "CAD"): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(amount);
}
