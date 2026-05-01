import { en } from "./en";
import { fr } from "./fr";
export type { I18nEn } from "./en";
export type { I18nFr } from "./fr";
export { en, fr };
export type Language = "en" | "fr";

const translations = { en, fr } as const;

export function useTranslation(lang: Language) {
  return translations[lang];
}

export function t(key: string, lang: Language): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = translations[lang];
  for (const part of parts) {
    current = current?.[part];
  }
  return typeof current === "string" ? current : key;
}
