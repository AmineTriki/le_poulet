'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavProfile {
  username: string
  avatar_emoji: string
}

export default function NavBar() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<NavProfile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      if (user) {
        supabase.from('profiles').select('username,avatar_emoji').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(data as NavProfile) })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        supabase.from('profiles').select('username,avatar_emoji').eq('id', uid).single()
          .then(({ data }) => { if (data) setProfile(data as NavProfile) })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setProfile(null)
    setDropdownOpen(false)
    router.refresh()
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-poulet-feather/20 bg-poulet-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-heading text-poulet-gold text-2xl tracking-wider">LE POULET</Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/rules" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors">Rules</Link>
          <Link href="/create" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors">Create</Link>
          <Link href="/join" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors">Join</Link>
          <Link href="/about" className="font-mono text-poulet-feather/50 text-xs uppercase hover:text-poulet-gold transition-colors">About</Link>

          {userId && profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors"
              >
                <div className="w-7 h-7 rounded-full border border-poulet-gold/50 bg-poulet-gold/10 flex items-center justify-center text-sm">
                  {profile.avatar_emoji}
                </div>
                <span>{profile.username}</span>
                <span className="text-poulet-feather/40">▾</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-poulet-black border border-poulet-feather/20 rounded-lg shadow-xl py-1 z-50">
                  <Link href={`/profile/${profile.username}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 font-mono text-poulet-feather text-xs hover:text-poulet-gold hover:bg-white/5 transition-colors">
                    👤 My Profile
                  </Link>
                  <Link href="/profile/edit" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 font-mono text-poulet-feather text-xs hover:text-poulet-gold hover:bg-white/5 transition-colors">
                    ✏️ Edit Profile
                  </Link>
                  <div className="border-t border-poulet-feather/10 my-1" />
                  <button onClick={() => void handleSignOut()} className="block w-full text-left px-4 py-2 font-mono text-poulet-feather/50 text-xs hover:text-red-400 hover:bg-white/5 transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors">Sign In</Link>
          )}

          <Link href="/download" className="bg-poulet-gold text-poulet-black font-heading text-sm px-4 py-1.5 uppercase hover:brightness-110 transition-all">
            📱 Get App
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-poulet-feather hover:text-poulet-gold transition-colors" onClick={() => setMenuOpen((v) => !v)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            ) : (
              <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-poulet-feather/10 bg-poulet-black/95 px-6 py-4 space-y-4">
          <Link href="/rules" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm uppercase hover:text-poulet-gold transition-colors">Rules</Link>
          <Link href="/create" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm uppercase hover:text-poulet-gold transition-colors">Create</Link>
          <Link href="/join" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm uppercase hover:text-poulet-gold transition-colors">Join</Link>
          <Link href="/download" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm uppercase hover:text-poulet-gold transition-colors">📱 Get App</Link>
          {userId && profile ? (
            <>
              <Link href={`/profile/${profile.username}`} onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">👤 {profile.username}</Link>
              <Link href="/profile/edit" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">✏️ Edit Profile</Link>
              <button onClick={() => { setMenuOpen(false); void handleSignOut() }} className="block font-mono text-poulet-feather/50 text-sm hover:text-red-400 transition-colors">Sign Out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block font-mono text-poulet-feather text-sm uppercase hover:text-poulet-gold transition-colors">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}
