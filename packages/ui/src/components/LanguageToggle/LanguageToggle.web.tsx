"use client";
import React from "react";

interface LanguageToggleProps {
  language: "en" | "fr";
  onChange: (lang: "en" | "fr") => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 border border-poulet-feather/40 p-0.5">
      {(["en", "fr"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={[
            "px-3 py-1 text-xs font-mono uppercase transition-all",
            language === lang
              ? "bg-poulet-gold text-poulet-black"
              : "text-poulet-feather hover:text-poulet-cream",
          ].join(" ")}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
