'use client'
export const dynamic = 'force-dynamic'
import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DownloadPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate'>('idle')

  const handleWaitlist = async () => {
    if (!email.trim()) return
    setStatus('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim() })
    if (!error) setStatus('success')
    else if (error.code === '23505') setStatus('duplicate')
    else setStatus('idle')
  }

  return (
    <main className="min-h-screen bg-poulet-black pt-20 px-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <Link href="/" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">← Back</Link>
          <h1 className="font-heading text-poulet-gold text-6xl uppercase mt-6">GET LE POULET ON YOUR PHONE 📱</h1>
        </div>

        {/* Right now — Expo Go */}
        <div className="border border-poulet-feather/20 rounded-xl p-8 space-y-6 bg-poulet-feather/5">
          <div>
            <div className="font-mono text-poulet-gold text-xs uppercase tracking-widest mb-2">Available Now</div>
            <h2 className="font-heading text-poulet-cream text-3xl uppercase">Play on your iPhone tonight.</h2>
            <p className="font-body text-poulet-feather/70 mt-3 leading-relaxed">
              While we prep the App Store release, you can run Le Poulet natively on your iPhone using Expo Go. Takes 2 minutes.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-poulet-gold flex items-center justify-center font-heading text-poulet-black text-sm shrink-0">1</div>
              <div>
                <p className="font-heading text-poulet-cream text-xl uppercase">Download Expo Go</p>
                <a
                  href="https://apps.apple.com/app/expo-go/id982107779"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 bg-white text-black font-body font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  🍎 App Store
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-poulet-gold flex items-center justify-center font-heading text-poulet-black text-sm shrink-0">2</div>
              <div>
                <p className="font-heading text-poulet-cream text-xl uppercase">Scan this code</p>
                <div className="mt-3 w-48 h-48 border-2 border-poulet-feather/20 rounded-xl flex items-center justify-center bg-white/5">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="font-mono text-poulet-feather/50 text-xs">QR code coming soon</p>
                  </div>
                </div>
                <p className="font-mono text-poulet-feather/40 text-xs mt-2">Or open this link on your phone: coming soon</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-poulet-gold flex items-center justify-center font-heading text-poulet-black text-sm shrink-0">3</div>
              <div>
                <p className="font-heading text-poulet-cream text-xl uppercase">That&apos;s it. BWAK. 🐔</p>
              </div>
            </div>
          </div>

          <p className="font-mono text-poulet-feather/40 text-xs border-t border-poulet-feather/10 pt-4">
            GPS, bar finder, and game features all work in Expo Go. Push notifications limited until native app ships.
          </p>
        </div>

        {/* Waitlist */}
        <div className="border-2 border-poulet-gold/40 rounded-xl p-8 space-y-4">
          <h2 className="font-heading text-poulet-gold text-3xl uppercase">Get notified when the native app drops</h2>
          {status === 'success' ? (
            <div className="bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-sm px-4 py-4 text-center rounded-lg">
              You&apos;re on the list. 🐔
            </div>
          ) : status === 'duplicate' ? (
            <div className="bg-poulet-gold/10 border border-poulet-gold/50 text-poulet-gold font-mono text-sm px-4 py-4 text-center rounded-lg">
              Already on the list! 🐔
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleWaitlist()}
                className="flex-1 bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
              />
              <button
                onClick={() => void handleWaitlist()}
                disabled={status === 'loading' || !email.trim()}
                className="bg-poulet-gold text-poulet-black font-heading text-sm px-5 py-3 rounded-lg uppercase hover:brightness-110 transition-all disabled:opacity-40 whitespace-nowrap"
              >
                {status === 'loading' ? '…' : 'Notify Me 🐔'}
              </button>
            </div>
          )}
        </div>

        {/* Android */}
        <div className="text-center space-y-2">
          <p className="font-heading text-poulet-feather/50 text-xl uppercase">Android</p>
          <p className="font-body text-poulet-feather/40 text-sm">Coming soon. Same waitlist above covers both.</p>
        </div>
      </div>
    </main>
  )
}
