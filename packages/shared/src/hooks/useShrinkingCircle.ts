"use client";
import { useState, useEffect } from "react";
import type { CircleState } from "../types/game";
import type { GameEvent } from "../types/events";

export function useShrinkingCircle(
  initialCircle: CircleState | null,
  subscribe: (cb: (event: GameEvent) => void) => () => void,
) {
  const [circle, setCircle] = useState<CircleState | null>(initialCircle);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "circle:shrink") {
        setCircle({
          centerLat: event.lat,
          centerLng: event.lng,
          radiusM: event.radiusM,
          nextShrinkAt: new Date(event.nextShrinkAt * 1000).toISOString(),
          shrinkCount: (circle?.shrinkCount ?? 0) + 1,
        });
      }
    });
  }, [subscribe, circle]);

  return circle;
}
