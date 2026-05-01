import React from "react";
import { colors } from "../../tokens/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-poulet-gold text-poulet-black hover:brightness-110 active:scale-95 font-bold shadow-gold",
  secondary: "bg-transparent border-2 border-poulet-gold text-poulet-gold hover:bg-poulet-gold hover:text-poulet-black",
  ghost: "bg-transparent text-poulet-cream hover:text-poulet-gold",
  danger: "bg-poulet-red text-white hover:brightness-110",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "font-heading uppercase tracking-wide rounded-none transition-all duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
