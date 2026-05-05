import React from 'react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-poulet-black pt-20 px-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <Link href="/" className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors">← Back</Link>
          <h1 className="font-heading text-poulet-gold text-7xl uppercase mt-6">ABOUT 🐔</h1>
        </div>

        <div className="space-y-6 font-body text-poulet-cream/80 text-lg leading-relaxed">
          <p>
            Le Poulet started as a group of friends running around Montreal looking for someone hiding in a bar. We kept playing. We built an app.
          </p>
          <p>
            It&apos;s free. It always will be. Play it anywhere.
          </p>
          <p className="font-heading text-poulet-gold text-2xl">Made in Montreal 🇨🇦</p>
        </div>

        <div className="border border-poulet-feather/20 rounded-xl p-8 space-y-4">
          <h2 className="font-heading text-poulet-gold text-3xl uppercase">Questions? Ideas? Found a bug?</h2>
          <p className="font-body text-poulet-feather/70">We actually read our emails.</p>
          <a
            href="mailto:hello@lepoulet.gg"
            className="inline-block bg-poulet-gold text-poulet-black font-heading text-lg px-8 py-3 uppercase hover:brightness-110 transition-all"
          >
            hello@lepoulet.gg
          </a>
        </div>
      </div>
    </main>
  )
}
