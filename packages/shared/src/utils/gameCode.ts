export function formatGameCode(code: string): string {
  return code.toUpperCase();
}

export function isValidGameCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
