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
        // Functional update: avoids a stale `circle` closure and keeps the
        // subscription stable (no unsubscribe/resubscribe on every shrink).
        setCircle((prev) => ({
          centerLat: event.lat,
          centerLng: event.lng,
          radiusM: event.radiusM,
          nextShrinkAt: new Date(event.nextShrinkAt * 1000).toISOString(),
          shrinkCount: (prev?.shrinkCount ?? 0) + 1,
        }));
      }
    });
  }, [subscribe]);

  return circle;
}
