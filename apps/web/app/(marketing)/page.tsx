import React from "react";
import Link from "next/link";

const TESTIMONIALS_EN = [
  'BWAK BWAK ★★★★★',
  '"WHERE IS THAT CHICKEN" ★★★★★',
  "My wife thinks I have connections ★★★★★",
  "Absolutely mental ★★★★★",
  "Sorry Mathieu ★★★★★",
  "10/10 would lose friends again ★★★★★",
  "I found the chicken in 8 minutes. I am a god. ★★★★★",
  "The bouncer thought we were insane. We were. ★★★★★",
];

const TESTIMONIALS_FR = [
  'BWAK BWAK ★★★★★',
  '"OÙ EST CE POULET" ★★★★★',
  "J'ai trouvé le poulet en métro ★★★★★",
  "Absolument déments ★★★★★",
  "Désolé Mathieu ★★★★★",
  "Meilleure soirée de ma vie ★★★★★",
  "J'ai gagné. Je suis une légende. ★★★★★",
  "Le videur pensait qu'on était fous. ★★★★★",
];

const RULES = [
  { num: "01", rule: "One person puts on the suit and picks a bar.", chaos: "Two chickens. Double the chaos. Double the confusion." },
  { num: "02", rule: "You get 30 min head start. Pick any bar. Hide.", chaos: "Head start is only 10 minutes. Run." },
  { num: "03", rule: "Teams use GPS + shrinking circle to find you.", chaos: "Chaos weapons let teams spy, trap, and steal points." },
  { num: "04", rule: "Photo & video challenges score bonus points.", chaos: "The Chicken judges all submissions. Subjectively." },
  { num: "05", rule: "First team to find you wins big.", chaos: "Last team to arrive buys everyone a round. Always." },
  { num: "06", rule: "The Chicken cannot move once they pick a bar.", chaos: "Unless you use the Decoy weapon. 🐔" },
];

const WEAPONS = [
  { emoji: "💣", name: "Air Strike", cost: "80pts", desc: "Target team drinks immediately. 20min cooldown." },
  { emoji: "📡", name: "Spy", cost: "60pts", desc: "See exact location of one team for 2 minutes." },
  { emoji: "☠️", name: "Booby Trap", cost: "50pts", desc: "Plant a fake chicken sighting at a bar." },
  { emoji: "💰", name: "Steal", cost: "40pts", desc: "Take 30 points from the nearest team." },
  { emoji: "🐔", name: "Decoy", cost: "100pts", desc: "Send a fake chicken signal on the map." },
  { emoji: "🔇", name: "Silence", cost: "70pts", desc: "Block a team's map for 5 minutes." },
];

const CITIES = [
  { name: "Montréal", country: "CA", active: true, emoji: "🍺" },
  { name: "Paris", country: "FR", active: false, emoji: "🥐" },
  { name: "Tunis", country: "TN", active: false, emoji: "🫖" },
  { name: "New York", country: "US", active: false, emoji: "🗽" },
  { name: "London", country: "GB", active: false, emoji: "☕" },
];

export default function LandingPage() {
  const allTestimonialsEN = [...TESTIMONIALS_EN, ...TESTIMONIALS_EN];
  const allTestimonialsFR = [...TESTIMONIALS_FR, ...TESTIMONIALS_FR];

  return (
    <main className="bg-poulet-black min-h-screen">
      {/* Floating feathers */}
      {[3, 6, 9, 13, 18].map((delay, i) => (
        <div
          key={i}
          className="feather"
          style={{
            left: `${15 + i * 18}%`,
            animationDuration: `${8 + i * 2}s`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-poulet-feather/20 bg-poulet-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="font-heading text-poulet-gold text-2xl tracking-wider">LE POULET</div>
          <div className="flex items-center gap-6">
            <Link
              href="/rules"
              className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors hidden md:block"
            >
              Rules
            </Link>
            <Link
              href="/join"
              className="font-mono text-poulet-feather text-xs uppercase hover:text-poulet-gold transition-colors hidden md:block"
            >
              Join
            </Link>
            <Link
              href="/create"
              className="bg-poulet-gold text-poulet-black font-heading text-sm px-4 py-1.5 uppercase hover:brightness-110 transition-all"
            >
              Play Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,197,24,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="font-heading text-poulet-feather/50 text-sm tracking-[0.5em] uppercase mb-6">
            Free · Open Source · Bilingual
          </div>
          <h1
            className="font-heading text-poulet-gold leading-none mb-4"
            style={{ fontSize: "clamp(4rem, 15vw, 14rem)" }}
          >
            HUNT YOUR
            <br />
            FRIENDS.
          </h1>
          <p className="font-body text-poulet-cream text-xl mb-10 max-w-2xl mx-auto italic">
            The free, chaotic, city-wide chicken hunt. No app needed. Works in your browser. Play
            tonight.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="bg-poulet-gold text-poulet-black font-heading text-2xl px-10 py-4 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold-lg"
            >
              🐔 Start a Hunt
            </Link>
            <Link
              href="/join"
              className="border-2 border-poulet-gold text-poulet-gold font-heading text-2xl px-10 py-4 uppercase hover:bg-poulet-gold hover:text-poulet-black transition-all"
            >
              Join a Game
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-poulet-feather text-xs uppercase">
            <span>🗺️ Live GPS map</span>
            <span>·</span>
            <span>📸 Photo challenges</span>
            <span>·</span>
            <span>⚡ Chaos weapons</span>
            <span>·</span>
            <span>🍺 Last team buys</span>
          </div>
        </div>

        {/* Animated chicken running at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div style={{ animation: "run-chicken 4s ease-in-out infinite alternate" }}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Body */}
              <ellipse cx="40" cy="48" rx="22" ry="18" fill="#F5C518" />
              {/* Head */}
              <circle cx="40" cy="22" r="13" fill="#F5C518" />
              {/* Comb */}
              <polygon points="34,10 37,16 40,9 43,16 46,10 44,18 36,18" fill="#C1121F" />
              {/* Wattle */}
              <ellipse cx="38" cy="30" rx="4" ry="5" fill="#C1121F" />
              {/* Eye */}
              <circle cx="43" cy="20" r="2.5" fill="#0A0805" />
              <circle cx="44" cy="19" r="0.8" fill="#F0EAD6" />
              {/* Beak */}
              <polygon points="50,22 58,24 50,26" fill="#F5C518" />
              {/* Left leg */}
              <rect x="30" y="64" width="5" height="12" rx="2" fill="#C1121F" />
              <rect x="25" y="74" width="10" height="3" rx="1" fill="#C1121F" />
              {/* Right leg */}
              <rect x="42" y="64" width="5" height="12" rx="2" fill="#C1121F" />
              <rect x="37" y="74" width="10" height="3" rx="1" fill="#C1121F" />
              {/* Wing */}
              <ellipse cx="28" cy="50" rx="8" ry="5" fill="#D4A400" transform="rotate(-20 28 50)" />
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes run-chicken {
            0%   { transform: translateX(-120px) scaleX(1); }
            45%  { transform: translateX(0px) scaleX(1); }
            55%  { transform: translateX(0px) scaleX(-1); }
            100% { transform: translateX(120px) scaleX(-1); }
          }
        `}</style>

        {/* Gold gradient bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-poulet-black to-transparent" />
      </section>

      {/* Social proof marquee */}
      <section className="py-8 overflow-hidden border-y border-poulet-feather/20">
        <div className="animate-marquee mb-3">
          {allTestimonialsEN.map((t, i) => (
            <span key={i} className="font-body italic text-poulet-cream/70 text-sm px-6 whitespace-nowrap">
              &ldquo;{t}&rdquo;
            </span>
          ))}
        </div>
        <div className="animate-marquee-reverse">
          {allTestimonialsFR.map((t, i) => (
            <span key={i} className="font-body italic text-poulet-gold/60 text-sm px-6 whitespace-nowrap">
              &ldquo;{t}&rdquo;
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-heading text-poulet-gold text-6xl uppercase mb-4 text-center">
          How It Works
        </h2>
        <p className="font-body text-poulet-feather italic text-center mb-16">
          Three steps to maximum chaos.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              emoji: "🐔",
              title: "One Person Becomes the Chicken",
              desc: "They put on the suit (or don't), grab the communal pot, pick any bar in the city, and hide. They get a head start. You get a 6-letter code.",
            },
            {
              num: "02",
              emoji: "🗺️",
              title: "Everyone Else Hunts",
              desc: "Teams use the live GPS map with a shrinking circle to track down the chicken. Complete photo challenges for bonus points along the way.",
            },
            {
              num: "03",
              emoji: "🏆",
              title: "First Team Wins, Last Team Buys",
              desc: "Find the chicken first for maximum points. Last team to arrive buys a round for everyone. Always. No exceptions.",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="border border-poulet-feather/30 bg-poulet-black p-8 relative group hover:border-poulet-gold transition-all duration-300"
            >
              <div className="font-mono text-poulet-gold/10 text-9xl absolute top-2 right-4 select-none leading-none">
                {step.num}
              </div>
              <div className="text-5xl mb-4 relative z-10">{step.emoji}</div>
              <h3 className="font-heading text-poulet-gold text-2xl uppercase mb-3 relative z-10">
                {step.title}
              </h3>
              <p className="font-body text-poulet-cream/80 relative z-10 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules section — flip cards */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-heading text-poulet-gold text-6xl uppercase mb-4 text-center">
          The Rules
        </h2>
        <p className="font-body text-poulet-feather text-center mb-16 italic">
          Hover each card to reveal the Chaos Mode alternative
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RULES.map((rule) => (
            <div
              key={rule.num}
              className="relative h-44 group cursor-default"
              style={{ perspective: "1000px" }}
            >
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:[transform:rotateY(180deg)]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 border border-poulet-feather/30 bg-poulet-black p-5 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="font-mono text-poulet-gold/30 text-3xl">{rule.num}</span>
                  <p className="font-body text-poulet-cream leading-relaxed">{rule.rule}</p>
                </div>
                {/* Back (Chaos) */}
                <div
                  className="absolute inset-0 border border-poulet-red bg-poulet-red/10 p-5 flex flex-col items-center justify-center [transform:rotateY(180deg)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="font-mono text-poulet-red text-xs uppercase mb-3 tracking-widest">
                    Chaos Mode
                  </div>
                  <p className="font-body text-poulet-cream text-center italic leading-relaxed">
                    {rule.chaos}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chaos Mode weapons */}
      <section className="py-24 px-6 bg-gradient-to-b from-poulet-black via-poulet-red/5 to-poulet-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block border-2 border-poulet-gold px-4 py-1 font-mono text-poulet-gold text-sm uppercase mb-6">
              Optional Mode
            </div>
            <h2 className="font-heading text-poulet-gold text-6xl uppercase">Chaos Mode ⚡</h2>
            <p className="font-body text-poulet-feather mt-4 italic text-lg max-w-xl mx-auto">
              Arm your team with weapons of mild destruction. Spend points. Cause mayhem. Regret
              nothing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEAPONS.map((w) => (
              <div
                key={w.name}
                className="border border-poulet-red/30 bg-poulet-black p-6 hover:border-poulet-red hover:glow-red transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-200 inline-block">
                    {w.emoji}
                  </span>
                  <span className="font-mono text-poulet-red text-sm border border-poulet-red/50 px-2 py-0.5">
                    {w.cost}
                  </span>
                </div>
                <h3 className="font-heading text-poulet-cream text-xl uppercase mb-2">{w.name}</h3>
                <p className="font-body text-poulet-feather text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="font-body text-poulet-feather/60 text-sm italic">
              All weapons require Chaos Mode to be enabled when creating the game.
            </p>
          </div>
        </div>
      </section>

      {/* Cities section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-heading text-poulet-gold text-6xl uppercase mb-4 text-center">
          Play Everywhere
        </h2>
        <p className="font-body text-poulet-feather text-center mb-16 italic">
          Montréal first. Then the world.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CITIES.map((city) => (
            <div
              key={city.name}
              className={[
                "border p-6 text-center transition-all duration-300",
                city.active
                  ? "border-poulet-gold bg-poulet-gold/10 shadow-gold"
                  : "border-poulet-feather/20 opacity-50",
              ].join(" ")}
            >
              <div className="text-4xl mb-3">{city.emoji}</div>
              <div className="font-heading text-poulet-gold uppercase text-lg">{city.name}</div>
              <div className="font-mono text-poulet-feather text-xs mt-1">{city.country}</div>
              {city.active ? (
                <div className="font-mono text-poulet-green text-xs mt-2">Live ●</div>
              ) : (
                <div className="font-mono text-poulet-feather/50 text-xs mt-2">Soon</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-poulet-gold/5 border-t border-poulet-gold/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🐔</div>
          <h2
            className="font-heading text-poulet-gold leading-none mb-8"
            style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
          >
            PLAY TONIGHT.
          </h2>
          <p className="font-body text-poulet-cream text-xl mb-12 italic max-w-2xl mx-auto">
            Free forever. No account needed. Works in any browser. Open source. Your friends are
            waiting.
          </p>
          <Link
            href="/create"
            className="inline-block bg-poulet-gold text-poulet-black font-heading text-3xl px-16 py-6 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold-lg"
          >
            START THE HUNT 🐔
          </Link>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <a
              href="https://github.com/AmineTriki/le_poulet"
              className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⭐ Star on GitHub
            </a>
            <span className="text-poulet-feather/30">|</span>
            <span className="font-mono text-poulet-feather text-sm">Free &amp; Open Source</span>
            <span className="text-poulet-feather/30">|</span>
            <Link
              href="/rules"
              className="font-mono text-poulet-feather text-sm hover:text-poulet-gold transition-colors"
            >
              Read the Rules
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-poulet-feather/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="font-heading text-poulet-gold text-xl">LE POULET</div>
          <div className="flex flex-wrap gap-6">
            <Link href="/rules" className="font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors">
              Rules
            </Link>
            <Link href="/create" className="font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors">
              Create
            </Link>
            <Link href="/join" className="font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors">
              Join
            </Link>
            <a
              href="https://github.com/AmineTriki/le_poulet"
              className="font-mono text-poulet-feather text-xs hover:text-poulet-gold transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
          <div className="font-mono text-poulet-feather text-xs opacity-60">
            Free. Open Source. Not responsible for what happens at the bar.
          </div>
        </div>
      </footer>
    </main>
  );
}
