'use client'
import React, { useState } from 'react'

export default function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={() => void handleShare()}
      className="w-full border border-poulet-feather/20 rounded-lg py-3 font-mono text-poulet-feather/70 text-sm hover:border-poulet-gold hover:text-poulet-gold transition-colors"
    >
      {copied ? 'Copied! 🐔' : '🔗 Share Profile'}
    </button>
  )
}
