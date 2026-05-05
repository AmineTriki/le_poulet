'use client'
export const dynamic = 'force-dynamic'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleGoogle = async () => {
    setLoading('google')
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleApple = async () => {
    setLoading('apple')
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmail = async () => {
    if (!email.trim() || !password) return
    setLoading('email')
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Invalid email or password. Try again.')
      setLoading(null)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-poulet-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <Link href="/" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">
            ← Back
          </Link>
          <div className="mt-6 text-center">
            <Link href="/" className="font-heading text-poulet-gold text-xl tracking-widest">LE POULET 🐔</Link>
            <h1 className="font-heading text-poulet-gold text-5xl mt-4">WELCOME BACK.</h1>
            <p className="font-body text-poulet-feather/70 mt-2 italic">Sign in to track your hunts.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogle}
            disabled={!!loading}
            className="w-full bg-white text-gray-900 font-body font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {loading === 'google' ? 'Redirecting…' : 'Sign in with Google'}
          </button>

          <button
            onClick={handleApple}
            disabled={!!loading}
            className="w-full bg-black text-white font-body font-semibold py-4 rounded-lg border border-white/20 flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.8 0 663 0 541.8c0-207.5 133.4-317.3 264.4-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 31.2 0 108.2 2.6 168.1 80.8z"/><path d="M554.1 107.5c24.1-28.2 43-67.9 43-107.5 0-5.8-.6-11.6-1.9-16.8-40.2 1.9-88.9 26.5-117.8 58.4-23.5 26.2-45 65.9-45 105.6 0 6.4 1.3 12.9 1.9 15.2 2.6.6 6.5 1.3 10.3 1.3 36.2 0 82.8-24 109.5-56.2z"/></svg>
            {loading === 'apple' ? 'Redirecting…' : 'Sign in with Apple'}
          </button>

          <button
            onClick={() => router.push('/phone-auth')}
            disabled={!!loading}
            className="w-full border-2 border-poulet-gold text-poulet-gold font-body font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-poulet-gold/10 transition-colors disabled:opacity-50"
          >
            📱 Continue with Phone
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-poulet-feather/20" />
          <span className="font-mono text-poulet-feather/50 text-xs">or continue with email</span>
          <div className="flex-1 h-px bg-poulet-feather/20" />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleEmail()}
              className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-poulet-feather/50 hover:text-poulet-feather transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="font-mono text-poulet-feather/50 text-xs hover:text-poulet-gold transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            onClick={() => void handleEmail()}
            disabled={!!loading || !email.trim() || !password}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            {loading === 'email' ? 'Signing in…' : 'Sign In'}
          </button>
        </div>

        <div className="text-center space-y-3">
          <p className="font-body text-poulet-feather/70 text-sm">
            New here?{' '}
            <Link href="/register" className="text-poulet-gold hover:underline">
              Create an account →
            </Link>
          </p>
          <p className="font-body text-poulet-feather/40 text-sm">
            Just want to play?{' '}
            <Link href="/join" className="hover:text-poulet-feather/70 transition-colors">
              Join a game →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
