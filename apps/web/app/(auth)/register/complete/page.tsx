'use client'
export const dynamic = 'force-dynamic'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['🐔', '🦊', '🐻', '🐯', '🦁', '🐸', '🐙', '🦅', '🐺', '🦝', '🐨', '🐼', '🎭', '🌶️', '🔥', '👻']

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[Math.floor(Math.random() * EMOJIS.length)] ?? '🐔')
  const [instagram, setInstagram] = useState('')
  const [vsco, setVsco] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router, supabase.auth])

  const checkUsername = useCallback(
    async (value: string) => {
      if (value.length < 3) { setUsernameStatus('invalid'); return }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) { setUsernameStatus('invalid'); return }
      setUsernameStatus('checking')
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('username', value)
      setUsernameStatus((count ?? 0) > 0 ? 'taken' : 'available')
    },
    [supabase],
  )

  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return }
    const timer = setTimeout(() => void checkUsername(username), 500)
    return () => clearTimeout(timer)
  }, [username, checkUsername])

  const handleSubmit = async () => {
    if (!username || !displayName || usernameStatus !== 'available') return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('profiles').insert({
      id: user.id,
      username: username.toLowerCase(),
      display_name: displayName,
      avatar_emoji: selectedEmoji,
      instagram_handle: instagram.trim() || null,
      vsco_handle: vsco.trim() || null,
    })

    if (err) { setError(err.message); setLoading(false) }
    else router.push('/')
  }

  const usernameHint = {
    idle: null,
    checking: <span className="text-poulet-feather/50">Checking…</span>,
    available: <span className="text-green-400">✓ Available</span>,
    taken: <span className="text-red-400">✗ Taken</span>,
    invalid: <span className="text-poulet-feather/50">3–20 chars, letters/numbers/_</span>,
  }[usernameStatus]

  return (
    <main className="min-h-screen bg-poulet-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-poulet-gold text-5xl">ONE MORE THING. 🐔</h1>
          <p className="font-body text-poulet-feather/70 mt-2 italic">Set up your hunter profile.</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-poulet-gold font-mono">@</span>
              <input
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-mono px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors pl-8"
              />
            </div>
            <div className="font-mono text-xs mt-1 pl-1">{usernameHint}</div>
          </div>

          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
          />

          <div>
            <p className="font-mono text-poulet-feather/50 text-xs mb-2 uppercase tracking-wider">Pick your avatar</p>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg transition-all ${selectedEmoji === emoji ? 'ring-2 ring-poulet-gold bg-poulet-gold/10' : 'hover:bg-white/5'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">Instagram</label>
            <input
              type="text"
              placeholder="yourusername (no @)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
            />
            <p className="font-mono text-poulet-feather/30 text-xs mt-1">We&apos;ll link to instagram.com/yourusername</p>
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">VSCO</label>
            <input
              type="text"
              placeholder="yourusername"
              value={vsco}
              onChange={(e) => setVsco(e.target.value)}
              className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
            />
            <p className="font-mono text-poulet-feather/30 text-xs mt-1">We&apos;ll link to vsco.co/yourusername</p>
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={loading || !username || !displayName || usernameStatus !== 'available'}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            {loading ? 'Saving…' : "LET'S HUNT 🐔"}
          </button>
        </div>
      </div>
    </main>
  )
}
