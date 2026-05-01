"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";

interface RouletteWheelProps {
  players: { name: string; emoji: string }[];
  onResult: (player: { name: string; emoji: string }) => void;
}

const COLORS = ["#F5C518", "#8B7355", "#C1121F", "#2DC653", "#457B9D", "#FB5607", "#8338EC", "#FF006E"];

export function RouletteWheel({ players, onResult }: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ name: string; emoji: string } | null>(null);

  const draw = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || players.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 8;
    const seg = (2 * Math.PI) / players.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    players.forEach((p, i) => {
      const start = angle + i * seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + seg);
      ctx.fillStyle = COLORS[i % COLORS.length] ?? "#F5C518";
      ctx.fill();
      ctx.strokeStyle = "#0A0805";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + seg / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0A0805";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`${p.emoji} ${p.name}`, r - 8, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#0A0805";
    ctx.fill();
    ctx.strokeStyle = "#F5C518";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pointer arrow
    ctx.beginPath();
    ctx.moveTo(cx + r + 4, cy);
    ctx.lineTo(cx + r - 16, cy - 10);
    ctx.lineTo(cx + r - 16, cy + 10);
    ctx.fillStyle = "#F5C518";
    ctx.fill();
  }, [players]);

  useEffect(() => { draw(0); }, [draw]);

  const spin = useCallback((fast: boolean) => {
    if (spinning || players.length === 0) return;
    setSpinning(true);
    setWinner(null);
    const duration = fast ? 900 : 7000 + Math.random() * 4000;
    const extra = (fast ? 2 : 5 + Math.random() * 4) * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const start = angleRef.current;
    const t0 = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      const cur = start + extra * ease;
      angleRef.current = cur;
      draw(cur);
      if (p < 1) { requestAnimationFrame(animate); return; }
      const seg = (2 * Math.PI) / players.length;
      const norm = ((cur % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const idx = Math.floor(((2 * Math.PI - norm) / seg)) % players.length;
      const result = players[idx];
      if (result) { setWinner(result); onResult(result); }
      setSpinning(false);
    };
    requestAnimationFrame(animate);
  }, [spinning, players, draw, onResult]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <canvas ref={canvasRef} width={380} height={380} className="rounded-full border-2 border-poulet-gold shadow-gold" />
      </div>
      {winner && (
        <div className="text-center bwak-text">
          <div className="font-heading text-poulet-gold text-5xl uppercase">{winner.emoji} {winner.name}</div>
          <div className="font-mono text-poulet-cream text-xl mt-1 tracking-widest">IS THE CHICKEN 🐔</div>
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={() => spin(false)} disabled={spinning} className="bg-poulet-gold text-poulet-black font-heading text-xl px-8 py-3 uppercase hover:brightness-110 disabled:opacity-50 transition-all">
          {spinning ? "SPINNING..." : "SLOW SPIN"}
        </button>
        <button onClick={() => spin(true)} disabled={spinning} className="border-2 border-poulet-gold text-poulet-gold font-heading text-xl px-8 py-3 uppercase hover:bg-poulet-gold hover:text-poulet-black disabled:opacity-50 transition-all">
          FAST ⚡
        </button>
      </div>
    </div>
  );
}
