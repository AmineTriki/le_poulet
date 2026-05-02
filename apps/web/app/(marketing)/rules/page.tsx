import React from "react";
import Link from "next/link";

export default function RulesPage() {
  return (
    <main className="bg-poulet-black min-h-screen pt-20 px-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="font-mono text-poulet-feather text-sm hover:text-poulet-gold mb-8 inline-block transition-colors"
        >
          ← Back
        </Link>
        <h1 className="font-heading text-poulet-gold text-7xl uppercase mb-4">The Rules</h1>
        <p className="font-body text-poulet-feather italic mb-12">
          Simple enough to explain at a bar. Chaotic enough to never play the same way twice.
        </p>
        <div className="space-y-10 font-body text-poulet-cream">
          {[
            {
              title: "The Chicken",
              body: "One player volunteers (or is chosen by roulette) to be the Chicken. They get a 30-minute head start to pick any bar in the city, arrive there, and start the game. They carry the communal pot and cannot leave the bar once they&apos;ve chosen it.",
            },
            {
              title: "The Hunt",
              body: "All other players split into teams of up to 4. The map shows a shrinking circle revealing the Chicken&apos;s approximate zone — starting at 1km radius, shrinking every 15 minutes, reaching 75m for the final reveal. Teams must physically travel to bars within the zone.",
            },
            {
              title: "Challenges",
              body: "Teams complete photo and video challenges along the way for bonus points. Challenges are submitted through the app and the Chicken judges all submissions in real time, awarding 1–100 points. Funny, creative, and unhinged submissions score higher.",
            },
            {
              title: "Finding the Chicken",
              body: "If you arrive at a bar and the Chicken isn&apos;t there: finish a drink, mark it visited, move on. The first team to physically locate and confront the Chicken wins the top bonus. Second and third teams score progressively less.",
            },
            {
              title: "Scoring",
              body: "1st to find: +100pts. 2nd: +75pts. 3rd: +50pts. After that: 0 bonus. Challenge points are cumulative throughout the hunt. The team with the most total points wins the pot. Last team to find the Chicken buys everyone a round. Always.",
            },
            {
              title: "The Chicken&apos;s View",
              body: "The Chicken gets a special screen showing all teams moving on the map. They see distance alerts when teams get close. They can broadcast taunts. Full dread mode. They also judge all photo challenges and can award up to 100 bonus points per submission.",
            },
            {
              title: "Chaos Mode (Optional)",
              body: "Enable Chaos Mode when creating the game to unlock weapons: Air Strike, Spy, Booby Trap, Steal, Decoy, and Silence. Teams earn weapon credits through challenges and can spend them to cause mayhem. Use with caution. Or don&apos;t.",
            },
          ].map((section) => (
            <div key={section.title} className="border-l-2 border-poulet-gold pl-6">
              <h2 className="font-heading text-poulet-gold text-3xl uppercase mb-3">
                {section.title}
              </h2>
              <p
                className="text-poulet-cream/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            </div>
          ))}
        </div>

        <div className="mt-16 border border-poulet-gold bg-poulet-gold/5 p-8 text-center">
          <div className="font-heading text-poulet-gold text-4xl uppercase mb-4">
            Ready to Play?
          </div>
          <p className="font-body text-poulet-feather italic mb-6">
            No account needed. No app install. Just a 6-letter code.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/create"
              className="bg-poulet-gold text-poulet-black font-heading text-xl px-8 py-3 uppercase hover:brightness-110 transition-all"
            >
              🐔 Create a Hunt
            </Link>
            <Link
              href="/join"
              className="border-2 border-poulet-gold text-poulet-gold font-heading text-xl px-8 py-3 uppercase hover:bg-poulet-gold hover:text-poulet-black transition-all"
            >
              Join a Game
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
