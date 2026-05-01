"use client";
import React, { useState, useEffect } from "react";

interface TimerProps {
  endsAt: string | null;
  label?: string;
  onExpire?: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function Timer({ endsAt, label, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) onExpire?.();
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <div className="text-center">
      {label && <div className="text-poulet-feather text-sm uppercase tracking-widest mb-1">{label}</div>}
      <div className="font-mono text-poulet-gold text-4xl tabular-nums">
        {h > 0 && `${pad(h)}:`}{pad(m)}:{pad(s)}
      </div>
    </div>
  );
}
