"use client";
import React from "react";
import Link from "next/link";
import { useAuthStore } from "@stores/authStore";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-poulet-feather/20 bg-poulet-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-heading text-poulet-gold text-2xl tracking-wider">LE POULET</Link>
        <div className="flex items-center gap-6">
          <Link href="/rules" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors hidden md:block">
            Rules
          </Link>
          <Link href="/join" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors hidden md:block">
            Join
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2 font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors"
              >
                <div className="w-7 h-7 rounded-full border border-poulet-gold/50 bg-poulet-feather/10 flex items-center justify-center text-sm overflow-hidden">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : "🐔"}
                </div>
                <span className="hidden md:inline">{user.display_name}</span>
              </Link>
              <button
                onClick={() => { clearAuth(); router.refresh(); }}
                className="font-mono text-poulet-feather/40 text-xs hover:text-poulet-feather transition-colors"
              >
                Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors hidden md:block">
              Sign In
            </Link>
          )}
          <Link href="/create" className="bg-poulet-gold text-poulet-black font-heading text-sm px-4 py-1.5 uppercase hover:brightness-110 transition-all">
            Play Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
