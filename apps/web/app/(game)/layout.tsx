import React from "react";
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-poulet-black min-h-dvh">
      {children}
    </div>
  );
}
