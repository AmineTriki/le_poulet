import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export function Card({ children, className = "", gold = false }: CardProps) {
  return (
    <div
      className={[
        "bg-poulet-black border rounded-none p-6",
        gold ? "border-poulet-gold shadow-gold" : "border-poulet-feather/30",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
