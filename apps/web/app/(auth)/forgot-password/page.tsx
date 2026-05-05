'use client'
export const dynamic = 'force-dynamic'
import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-poulet-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <Link href="/login" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">← Back</Link>
          <div className="mt-6 text-center">
            <h1 className="font-heading text-poulet-gold text-4xl">FORGOT YOUR PASSWORD?</h1>
            <p className="font-body text-poulet-feather/70 mt-2 italic">
              {sent ? 'Check your inbox. Link expires in 1 hour.' : "Enter your email and we'll send a reset link."}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">{error}</div>
        )}

        {sent ? (
          <div className="bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-sm px-4 py-6 text-center">
            ✓ Check your inbox. Link expires in 1 hour.
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={loading || !email.trim()}
              className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
