"use client";
import React from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

const LeafletMap = dynamic(() => import("@components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-poulet-black flex items-center justify-center">
      <div className="font-mono text-poulet-gold animate-pulse">Loading map...</div>
    </div>
  ),
});

export default function HuntPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="h-screen bg-poulet-black flex flex-col">
      <div className="h-14 border-b border-poulet-feather/20 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-heading text-poulet-gold text-2xl">HUNT</div>
          <div className="font-mono text-poulet-feather text-sm border border-poulet-feather/30 px-2 py-0.5">{code}</div>
        </div>
        <Link href={`/results/${code}`} className="font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors">
          End Game →
        </Link>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <LeafletMap gameCode={code ?? ""} />
      </div>
    </div>
  );
}
