import React from "react";

type BadgeVariant = "gold" | "red" | "green" | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: "bg-poulet-gold text-poulet-black",
  red: "bg-poulet-red text-white",
  green: "bg-poulet-green text-poulet-black",
  default: "bg-poulet-feather text-poulet-cream",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
