import React from "react";
import type { Challenge } from "@le-poulet/shared";

interface ChallengeCardProps {
  challenge: Challenge;
  language: "en" | "fr";
  onSubmit?: () => void;
  timeRemaining?: number;
}

export function ChallengeCard({ challenge, language, onSubmit, timeRemaining }: ChallengeCardProps) {
  const title = language === "fr" ? challenge.titleFr : challenge.titleEn;
  const desc = language === "fr" ? challenge.descFr : challenge.descEn;
  const difficultyColors = { easy: "text-poulet-green", medium: "text-poulet-gold", hard: "text-poulet-red" };

  return (
    <div className="border-2 border-poulet-gold bg-poulet-black p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-mono uppercase ${difficultyColors[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            <span className="text-xs font-mono text-poulet-feather">{challenge.category}</span>
            {challenge.mediaType === "video" ? "🎥" : "📸"}
          </div>
          <h3 className="font-heading text-poulet-gold text-2xl uppercase">{title}</h3>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="font-mono text-poulet-gold text-3xl">{challenge.points}</div>
          <div className="text-poulet-feather text-xs">pts</div>
        </div>
      </div>
      <p className="font-body text-poulet-cream">{desc}</p>
      {timeRemaining !== undefined && (
        <div className="font-mono text-poulet-red text-sm">{timeRemaining}s remaining</div>
      )}
      {onSubmit && (
        <button onClick={onSubmit} className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-3 uppercase hover:brightness-110 transition-all">
          Submit {challenge.mediaType === "video" ? "Video" : "Photo"}
        </button>
      )}
    </div>
  );
}
