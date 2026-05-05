'use client'
export const dynamic = 'force-dynamic'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  { flag: '🇨🇦', name: 'Canada', code: '+1' },
  { flag: '🇺🇸', name: 'United States', code: '+1' },
  { flag: '🇫🇷', name: 'France', code: '+33' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44' },
  { flag: '🇹🇳', name: 'Tunisia', code: '+216' },
  { flag: '🇩🇿', name: 'Algeria', code: '+213' },
  { flag: '🇲🇦', name: 'Morocco', code: '+212' },
  { flag: '🇧🇪', name: 'Belgium', code: '+32' },
  { flag: '🇨🇭', name: 'Switzerland', code: '+41' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇪🇸', name: 'Spain', code: '+34' },
  { flag: '🇮🇹', name: 'Italy', code: '+39' },
  { flag: '🇵🇹', name: 'Portugal', code: '+351' },
  { flag: '🇳🇱', name: 'Netherlands', code: '+31' },
]

const MAIN_COUNTRIES = COUNTRIES.slice(0, 7)
const MORE_COUNTRIES = COUNTRIES.slice(7)

export default function PhoneAuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]!)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const fullNumber = selectedCountry.code + phone.replace(/\D/g, '')

  useEffect(() => {
    if (resendSeconds <= 0) return
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendSeconds])

  const handleSend = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fullNumber })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setStep('otp')
      setResendSeconds(60)
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const next = [...otp]
      digits.forEach((d, i) => { if (index + i < 6) next[index + i] = d })
      setOtp(next)
      const focusIdx = Math.min(index + digits.length, 5)
      otpRefs.current[focusIdx]?.focus()
      if (digits.length === 6) void handleVerify(next.join(''))
      return
    }
    const next = [...otp]
    next[index] = value.replace(/\D/g, '')
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(Boolean) && next.join('').length === 6) void handleVerify(next.join(''))
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (token?: string) => {
    const code = token ?? otp.join('')
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: fullNumber,
      token: code,
      type: 'sms',
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single()
      router.push(profile ? '/' : '/register/complete')
    }
  }

  if (step === 'otp') {
    return (
      <main className="min-h-screen bg-poulet-black flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="font-heading text-poulet-gold text-5xl">CHECK YOUR PHONE.</h1>
            <p className="font-body text-poulet-feather/70 mt-3 italic">
              We sent a 6-digit code to {fullNumber}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-mono bg-[#1a1612] border border-poulet-feather/20 text-poulet-gold rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
              />
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => void handleVerify()}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 transition-all disabled:opacity-40"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <button
              onClick={() => void handleSend()}
              disabled={resendSeconds > 0 || loading}
              className="w-full font-mono text-poulet-feather/60 text-sm py-2 hover:text-poulet-feather transition-colors disabled:opacity-40"
            >
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
            </button>

            <button
              onClick={() => { setStep('phone'); setOtp(Array(6).fill('')); setError('') }}
              className="w-full font-mono text-poulet-feather/40 text-xs hover:text-poulet-feather/70 transition-colors"
            >
              Use a different number
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-poulet-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <Link href="/login" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">
            ← Back
          </Link>
          <div className="mt-6 text-center">
            <h1 className="font-heading text-poulet-gold text-5xl">YOUR NUMBER.</h1>
            <p className="font-body text-poulet-feather/70 mt-2 italic">We&apos;ll text you a code.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-sm px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <select
            value={selectedCountry.code + selectedCountry.name}
            onChange={(e) => {
              const found = COUNTRIES.find((c) => c.code + c.name === e.target.value)
              if (found) setSelectedCountry(found)
            }}
            className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
          >
            {MAIN_COUNTRIES.map((c) => (
              <option key={c.name} value={c.code + c.name}>
                {c.flag} {c.code} {c.name}
              </option>
            ))}
            <option disabled>──────────────</option>
            {MORE_COUNTRIES.map((c) => (
              <option key={c.name} value={c.code + c.name}>
                {c.flag} {c.code} {c.name}
              </option>
            ))}
          </select>

          <input
            type="tel"
            inputMode="numeric"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            className="w-full bg-[#1a1612] border border-poulet-feather/20 text-poulet-cream font-body px-4 py-3 rounded-lg focus:outline-none focus:border-poulet-gold transition-colors"
          />

          <button
            onClick={() => void handleSend()}
            disabled={loading || !phone.trim()}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 rounded-lg uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            {loading ? 'Sending…' : 'Send Code'}
          </button>
        </div>
      </div>
    </main>
  )
}
