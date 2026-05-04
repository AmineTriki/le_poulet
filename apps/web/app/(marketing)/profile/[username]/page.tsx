"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  instagram_url: string | null;
  vsco_url: string | null;
  games_played: number;
  chickens_caught: number;
  times_chicken: number;
  created_at: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${API}/api/v1/auth/profile/${username}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json() as Promise<UserProfile>;
      })
      .then((d) => { if (d) { setProfile(d); setLoading(false); } })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-poulet-black flex items-center justify-center pt-14">
      <div className="font-mono text-poulet-gold animate-pulse">Loading...</div>
    </div>
  );

  if (notFound || !profile) return (
    <div className="min-h-screen bg-poulet-black flex items-center justify-center pt-14">
      <div className="text-center space-y-4">
        <div className="font-heading text-poulet-gold text-4xl uppercase">Hunter Not Found</div>
        <Link href="/" className="font-mono text-poulet-feather hover:text-poulet-gold transition-colors">← Back home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-poulet-black px-6 py-20 pt-24">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Avatar + header */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-poulet-gold flex items-center justify-center text-4xl bg-poulet-feather/10 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : "🐔"}
          </div>
          <div>
            <div className="font-heading text-poulet-gold text-3xl uppercase">{profile.display_name}</div>
            <div className="font-mono text-poulet-feather text-sm">@{profile.username}</div>
            {profile.bio && <div className="font-body text-poulet-cream/70 text-sm mt-1 italic">{profile.bio}</div>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Games Played", value: profile.games_played, icon: "🎮" },
            { label: "Chickens Caught", value: profile.chickens_caught, icon: "🐔" },
            { label: "Times Chicken", value: profile.times_chicken, icon: "🥚" },
          ].map((stat) => (
            <div key={stat.label} className="border border-poulet-feather/20 p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-heading text-poulet-gold text-2xl">{stat.value}</div>
              <div className="font-mono text-poulet-feather text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Social links */}
        {(profile.instagram_url || profile.vsco_url) && (
          <div className="border border-poulet-feather/20 p-4 space-y-3">
            <div className="font-mono text-poulet-feather text-xs uppercase">Socials</div>
            {profile.instagram_url && (
              <a
                href={profile.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-poulet-cream hover:text-poulet-gold transition-colors font-body"
              >
                <span>📸</span> Instagram
              </a>
            )}
            {profile.vsco_url && (
              <a
                href={profile.vsco_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-poulet-cream hover:text-poulet-gold transition-colors font-body"
              >
                <span>🎞️</span> VSCO
              </a>
            )}
          </div>
        )}

        <Link href="/" className="block text-center font-mono text-poulet-feather/50 text-sm hover:text-poulet-feather transition-colors">
          ← Back to Le Poulet
        </Link>
      </div>
    </div>
  );
}
