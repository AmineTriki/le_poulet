import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ShareButton from './ShareButton'

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_emoji: string
  bio: string | null
  instagram_handle: string | null
  vsco_handle: string | null
  games_played: number
  times_chicken: number
  chickens_caught: number
  challenges_won: number
}

interface PageProps {
  params: { username: string }
}

export default async function ProfilePage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const p = profile as Profile

  const { data: { user } } = await supabase.auth.getUser()
  const isOwn = user?.id === p.id

  const stats = [
    { icon: '🎮', label: 'Games', value: p.games_played },
    { icon: '🐔', label: 'Times Chicken', value: p.times_chicken },
    { icon: '🏆', label: 'Chickens Caught', value: p.chickens_caught },
    { icon: '📸', label: 'Challenges Won', value: p.challenges_won },
  ]

  return (
    <main className="min-h-screen bg-poulet-black pt-6 px-6 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">← Back</Link>
          {isOwn && (
            <Link href="/profile/edit" className="font-mono text-poulet-feather/60 text-xs hover:text-poulet-gold transition-colors border border-poulet-feather/20 px-3 py-1 rounded">
              ✏️ Edit Profile
            </Link>
          )}
        </div>

        <div className="border border-poulet-gold/30 bg-poulet-gold/5 rounded-xl p-8 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-poulet-gold/20 border-2 border-poulet-gold flex items-center justify-center text-4xl mx-auto mb-4">
            {p.avatar_emoji}
          </div>
          <h1 className="font-heading text-poulet-gold text-3xl">{p.display_name}</h1>
          <p className="font-mono text-poulet-feather/60 text-sm mt-1">@{p.username}</p>
          {p.bio && <p className="font-body text-poulet-cream/80 italic mt-3 text-sm line-clamp-2">{p.bio}</p>}
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="bg-poulet-feather/5 rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="font-heading text-poulet-gold text-xl">{value}</div>
              <div className="font-mono text-poulet-feather/50 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {(p.instagram_handle ?? p.vsco_handle) && (
          <div className="flex gap-3 mb-6">
            {p.instagram_handle && (
              <a
                href={`https://instagram.com/${p.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-poulet-feather/20 rounded-lg py-3 text-center font-mono text-poulet-feather/70 text-sm hover:border-poulet-gold hover:text-poulet-gold transition-colors"
              >
                📷 Instagram
              </a>
            )}
            {p.vsco_handle && (
              <a
                href={`https://vsco.co/${p.vsco_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-poulet-feather/20 rounded-lg py-3 text-center font-mono text-poulet-feather/70 text-sm hover:border-poulet-gold hover:text-poulet-gold transition-colors"
              >
                📸 VSCO
              </a>
            )}
          </div>
        )}

        <ShareButton username={p.username} />

        <div className="mt-8 border-l-2 border-poulet-feather/10 pl-4">
          <h2 className="font-heading text-poulet-feather/50 text-xl mb-4">RECENT GAMES</h2>
          <p className="font-body text-poulet-feather/40 italic">No games yet. Time to hunt. 🐔</p>
        </div>
      </div>
    </main>
  )
}
