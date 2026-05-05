'use client'
export const dynamic = 'force-dynamic'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['🐔', '🦊', '🐻', '🐯', '🦁', '🐸', '🐙', '🦅', '🐺', '🦝', '🐨', '🐼', '🎭', '🌶️', '🔥', '👻']

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_emoji: string
  bio: string | null
  instagram_handle: string | null
  vsco_handle: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🐔')
  const [instagram, setInstagram] = useState('')
  const [vsco, setVsco] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        const p = data as Profile
        setProfile(p)
        setUsername(p.username)
        setDisplayName(p.display_name)
        setBio(p.bio ?? '')
        setSelectedEmoji(p.avatar_emoji)
        setInstagram(p.instagram_handle ?? '')
        setVsco(p.vsco_handle ?? '')
        setUsernameStatus('unchanged')
      }
    })
  }, [router, supabase])

  const checkUsername = useCallback(
    async (value: string) => {
      if (value === profile?.username) { setUsernameStatus('unchanged'); return }
      if (value.length < 3 || !/^[a-zA-Z0-9_]{3,20}$/.test(value)) { setUsernameStatus('invalid'); return }
      setUsernameStatus('checking')
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('username', value)
      setUsernameStatus((count ?? 0) > 0 ? 'taken' : 'available')
    },
    [profile?.username, supabase],
  )

  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return }
    const timer = setTimeout(() => void checkUsername(username), 500)
    return () => clearTimeout(timer)
  }, [username, checkUsername])

  const handleSave = async () => {
    if (!profile || usernameStatus === 'taken' || usernameStatus === 'invalid') return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('profiles').update({
      username: username.toLowerCase(),
      display_name: displayName,
      avatar_emoji: selectedEmoji,
      bio: bio.trim() || null,
      instagram_handle: instagram.trim() || null,
      vsco_handle: vsco.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)

    if (err) { setError(err.message); setLoading(false) }
    else router.push(`/profile/${username.toLowerCase()}`)
  }

  const handleDelete = async () => {
    if (!profile) return
    await supabase.from('profiles').delete().eq('id', profile.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-poulet-black flex items-center justify-center">
        <div className="font-mono text-poulet-feather/50">Loading…</div>
      </main>
    )
  }

  const usernameHint = {
    idle: null,
    checking: <span className="text-poulet-feather/50">Checking…</span>,
    available: <span className="text-green-400">✓ Available</span>,
    taken: <span className="text-red-400">✗ Taken</span>,
    invalid: <span className="text-poulet-feather/50">3–20 chars, letters/numbers/_</span>,
    unchanged: null,
  }[usernameStatus]

  return (
    <main className="min-h-screen bg-poulet-black px-6 py-12">
      <div className="max-w-sm mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${profile.username}`} className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">← Back to Profile</Link>
          <h1 className="font-heading text-poulet-gold text-2xl">EDIT PROFILE</h1>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-poulet-gold font-mono">@</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))} className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-mono px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors pl-8" />
            </div>
            <div className="font-mono text-xs mt-1 pl-1">{usernameHint}</div>
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors" />
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors resize-none" />
          </div>

          <div>
            <p className="font-mono text-poulet-feather/50 text-xs mb-2 uppercase tracking-wider">Avatar</p>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => setSelectedEmoji(emoji)} className={`text-2xl p-2 rounded-lg transition-all ${selectedEmoji === emoji ? 'ring-2 ring-poulet-gold bg-poulet-gold/10' : 'hover:bg-white/5'}`}>{emoji}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">Instagram</label>
            <input type="text" placeholder="yourusername (no @)" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors" />
          </div>

          <div>
            <label className="font-mono text-poulet-feather/50 text-xs uppercase tracking-wider block mb-1">VSCO</label>
            <input type="text" placeholder="yourusername" value={vsco} onChange={(e) => setVsco(e.target.value)} className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors" />
          </div>

          <button onClick={() => void handleSave()} disabled={loading || usernameStatus === 'taken' || usernameStatus === 'invalid'} className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 transition-all disabled:opacity-40">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="border border-red-900/50 rounded-xl p-6 space-y-3">
          <h2 className="font-heading text-red-400 text-lg">DANGER ZONE</h2>
          <p className="font-mono text-poulet-feather/40 text-xs">Permanently deletes your account and all data.</p>
          <button onClick={() => setShowDeleteModal(true)} className="w-full border border-red-900/70 text-red-400 font-mono text-sm py-3 rounded-lg hover:bg-red-900/20 transition-colors">
            Delete Account
          </button>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-6">
            <div className="bg-poulet-black border border-red-900/50 rounded-xl p-8 max-w-sm w-full space-y-4">
              <h3 className="font-heading text-red-400 text-2xl">ARE YOU SURE?</h3>
              <p className="font-body text-poulet-feather/70 text-sm">This cannot be undone. Your account and all data will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-poulet-feather/20 text-poulet-feather font-mono text-sm py-3 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => void handleDelete()} className="flex-1 bg-red-700 text-white font-mono text-sm py-3 rounded-lg hover:bg-red-800 transition-colors">Delete Forever</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
