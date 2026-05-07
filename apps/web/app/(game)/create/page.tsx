"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@hooks/useGameSession";

interface GameSuggestion {
  num_chickens: number;
  team_size: number;
  num_teams: number;
  description: string;
  pot_examples: Record<string, number>;
}

interface BarArea {
  name: string;
  center_lat: number;
  center_lng: number;
  bar_count: number;
  bars: { id: string; name: string; lat: number; lng: number }[];
}

type CostumePolicy = "required" | "encouraged" | "optional" | "none";
type GageType = "round" | "dare" | "custom";

interface GameFormData {
  name: string;
  city: string;
  language: "en" | "fr";
  players: { name: string; emoji: string }[];
  numChickens: number;
  headStartMinutes: number;
  gameDurationHours: number;
  teamSize: number;
  gpsShrinkIntervalMinutes: number;
  buyInAmount: number;
  costumePolicy: CostumePolicy;
  chaosMode: boolean;
  allowCalls: boolean;
  allowTexts: boolean;
  allowHints: boolean;
  allowSocialMedia: boolean;
  gageType: GageType;
  gageCustomText: string;
}

const EMOJIS = [
  "🦊", "🐺", "🦁", "🐯", "🐻", "🦅", "🐉", "🦄",
  "🐸", "🦋", "🐬", "🦉", "🦝", "🐨", "🦘",
];
const CITIES = ["Montreal", "Paris", "Tunis", "NYC", "London", "Other"];
const BUY_INS = [0, 5, 10, 20, 50, 100, 200];

const DEFAULT_FORM: GameFormData = {
  name: "",
  city: "Montreal",
  language: "en",
  players: [],
  numChickens: 1,
  headStartMinutes: 30,
  gameDurationHours: 2,
  teamSize: 4,
  gpsShrinkIntervalMinutes: 15,
  buyInAmount: 0,
  costumePolicy: "encouraged",
  chaosMode: false,
  allowCalls: true,
  allowTexts: true,
  allowHints: false,
  allowSocialMedia: true,
  gageType: "round",
  gageCustomText: "",
};

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<GameFormData>(DEFAULT_FORM);
  const [newPlayer, setNewPlayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playerCountEstimate, setPlayerCountEstimate] = useState(10);
  const [suggestion, setSuggestion] = useState<GameSuggestion | null>(null);
  const [areas, setAreas] = useState<BarArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchSuggestion = useCallback(async (count: number) => {
    try {
      const r = await fetch(`${API}/api/v1/suggest/config?player_count=${count}`);
      if (r.ok) {
        const s = (await r.json()) as GameSuggestion;
        setSuggestion(s);
        update("numChickens", s.num_chickens);
        update("teamSize", s.team_size);
      }
    } catch { /* silent */ }
  }, [API]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const r = await fetch(`${API}/api/v1/suggest/areas?city=${form.city.toLowerCase()}`);
      if (r.ok) setAreas((await r.json()) as BarArea[]);
    } catch { /* silent */ }
    setLoadingAreas(false);
  }, [API, form.city]);

  useEffect(() => {
    void fetchSuggestion(playerCountEstimate);
  }, [playerCountEstimate, fetchSuggestion]);

  useEffect(() => {
    if (step === 4) void fetchAreas();
  }, [step, fetchAreas]);

  const update = <K extends keyof GameFormData>(key: K, value: GameFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    const emoji = EMOJIS[form.players.length % EMOJIS.length] ?? "🐔";
    update("players", [...form.players, { name: newPlayer.trim(), emoji }]);
    setNewPlayer("");
  };

  const totalPot = form.buyInAmount * Math.max(form.players.length, 1);

  const handleLaunch = async () => {
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const hostPlayer = form.players[0] ?? { name: "Host", emoji: "👑" };
      const res = await fetch(
        `${API}/api/v1/games/?host_name=${encodeURIComponent(hostPlayer.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name || "Chicken Hunt",
            city: form.city.toLowerCase().replace(" ", "_"),
            language: form.language,
            num_chickens: form.numChickens,
            head_start_minutes: form.headStartMinutes,
            game_duration_hours: form.gameDurationHours,
            team_size: form.teamSize,
            gps_shrink_interval_minutes: form.gpsShrinkIntervalMinutes,
            buy_in_amount: form.buyInAmount,
            costume_policy: form.costumePolicy,
            chaos_mode: form.chaosMode,
            allow_calls: form.allowCalls,
            allow_texts: form.allowTexts,
            allow_hints: form.allowHints,
            allow_social_media: form.allowSocialMedia,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { game_code: string; game_id: string; host_token: string; host_player_id: string };
      saveSession({
        gameCode: data.game_code,
        gameId: data.game_id,
        playerId: data.host_player_id,
        playerToken: data.host_token,
        isHost: true,
        hostToken: data.host_token,
      });
      router.push(`/lobby/${data.game_code}`);
    } catch (err) {
      setError("Failed to create game. Is the server running?");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border border-poulet-feather/40 text-poulet-cream font-body px-4 py-3 focus:outline-none focus:border-poulet-gold transition-colors";
  const pillClass = (active: boolean) =>
    `px-4 py-2 font-mono text-sm uppercase border transition-all cursor-pointer ${
      active
        ? "bg-poulet-gold text-poulet-black border-poulet-gold"
        : "border-poulet-feather/40 text-poulet-feather hover:border-poulet-gold hover:text-poulet-gold"
    }`;

  const steps = ["Setup", "Players", "Rules", "Bar", "Suit", "Launch"];

  return (
    <div className="min-h-screen bg-poulet-black px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="font-heading text-poulet-gold text-3xl tracking-wider mb-1">LE POULET</div>
          <div className="font-mono text-poulet-feather text-xs uppercase">Create a new hunt</div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1 transition-all duration-300 ${
                  i + 1 <= step ? "bg-poulet-gold" : "bg-poulet-feather/20"
                }`}
              />
              <div
                className={`text-xs font-mono mt-1 transition-colors ${
                  i + 1 === step ? "text-poulet-gold" : "text-poulet-feather/40"
                }`}
              >
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Setup */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Setup</h1>
            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Game Name
              </label>
              <input
                className={inputClass}
                placeholder="Friday Night Hunt"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                City
              </label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c} onClick={() => update("city", c)} className={pillClass(form.city === c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Language
              </label>
              <div className="flex gap-2">
                {(["en", "fr"] as const).map((l) => (
                  <button key={l} onClick={() => update("language", l)} className={pillClass(form.language === l)}>
                    {l === "en" ? "English" : "Français"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Players */}
        {step === 2 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Players</h1>
            <p className="font-body text-poulet-feather italic text-sm">
              Add players now, or share the game code later and let them join themselves.
            </p>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Player name"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
              <button
                onClick={addPlayer}
                className="bg-poulet-gold text-poulet-black font-heading text-lg px-6 uppercase hover:brightness-110 transition-all"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {form.players.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-poulet-feather/30 px-4 py-3 group"
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="font-body text-poulet-cream flex-1">{p.name}</span>
                  {i === 0 && (
                    <span className="font-mono text-poulet-gold text-xs">HOST</span>
                  )}
                  <button
                    onClick={() => update("players", form.players.filter((_, j) => j !== i))}
                    className="text-poulet-feather hover:text-poulet-red transition-colors text-sm opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.players.length === 0 && (
                <div className="border border-dashed border-poulet-feather/20 p-8 text-center text-poulet-feather font-body italic">
                  No players yet. Add some above, or share the link after creating and let them join.
                </div>
              )}
            </div>

            {/* Player count estimate + suggestion */}
            <div className="border border-poulet-feather/20 p-5 space-y-4 bg-poulet-feather/5">
              <div>
                <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                  Estimated total players (for team suggestions)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[4, 6, 8, 10, 15, 20, 25, 30, 40].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPlayerCountEstimate(n)}
                      className={pillClass(playerCountEstimate === n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {suggestion && (
                <div className="border border-poulet-gold/40 bg-poulet-gold/5 px-4 py-3">
                  <div className="font-mono text-poulet-gold text-xs uppercase mb-1">Suggested Config</div>
                  <div className="font-heading text-poulet-cream text-xl">{suggestion.description}</div>
                  <div className="font-mono text-poulet-feather/60 text-xs mt-1">
                    Pot with $10/person: ${suggestion.pot_examples["10"] ?? playerCountEstimate * 10}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Rules */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Rules</h1>

            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Number of Chickens
                {suggestion && (
                  <span className="ml-2 text-poulet-gold/60 normal-case">
                    (suggested: {suggestion.num_chickens} for {playerCountEstimate} players)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => update("numChickens", n)}
                    className={pillClass(form.numChickens === n)}
                  >
                    {n} {n === 1 ? "🐔" : "🐔🐔"}
                  </button>
                ))}
              </div>
              {suggestion && (
                <p className="font-mono text-poulet-feather/40 text-xs mt-2">
                  ~{suggestion.num_teams} team{suggestion.num_teams !== 1 ? "s" : ""} of {suggestion.team_size} hunters
                </p>
              )}
            </div>

            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-3 block">
                Head Start:{" "}
                <span className="text-poulet-gold">{form.headStartMinutes} min</span>
              </label>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={form.headStartMinutes}
                onChange={(e) => update("headStartMinutes", Number(e.target.value))}
                className="w-full accent-poulet-gold"
              />
              <div className="flex justify-between font-mono text-poulet-feather/40 text-xs mt-1">
                <span>10 min</span>
                <span>60 min</span>
              </div>
            </div>

            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-3 block">
                Game Duration:{" "}
                <span className="text-poulet-gold">{form.gameDurationHours} hrs</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={form.gameDurationHours}
                onChange={(e) => update("gameDurationHours", Number(e.target.value))}
                className="w-full accent-poulet-gold"
              />
              <div className="flex justify-between font-mono text-poulet-feather/40 text-xs mt-1">
                <span>1 hr</span>
                <span>4 hrs</span>
              </div>
            </div>

            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Buy-In Per Player
              </label>
              <div className="flex flex-wrap gap-2">
                {BUY_INS.map((b) => (
                  <button
                    key={b}
                    onClick={() => update("buyInAmount", b)}
                    className={pillClass(form.buyInAmount === b)}
                  >
                    {b === 0 ? "Free" : `$${b}`}
                  </button>
                ))}
              </div>
              {form.buyInAmount > 0 && (
                <div className="mt-4 border border-poulet-gold/40 bg-poulet-gold/5 p-4">
                  <div className="font-mono text-poulet-feather/60 text-xs uppercase mb-1">The Pot</div>
                  <div className="font-heading text-poulet-gold text-4xl">
                    ${form.buyInAmount * (form.players.length || playerCountEstimate)}
                  </div>
                  <div className="font-mono text-poulet-feather/50 text-xs mt-1">
                    {form.players.length > 0 ? form.players.length : playerCountEstimate} players × ${form.buyInAmount}
                  </div>
                  <div className="font-mono text-poulet-feather/40 text-xs mt-3 border-t border-poulet-feather/10 pt-3">
                    Chicken runs a tab while hiding. First team to find them drinks free until the pot runs out.
                  </div>
                </div>
              )}
              {form.buyInAmount === 0 && (
                <p className="font-mono text-poulet-feather/40 text-xs mt-2">
                  Free night — bragging rights only. Still fun.
                </p>
              )}
            </div>

            {/* Un gage */}
            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Un Gage for Last Team <span className="text-poulet-gold">(always applies)</span>
              </label>
              <p className="font-body text-poulet-feather/50 text-xs mb-3 italic">
                The last team to find the Chicken always gets a gage. Non-negotiable.
              </p>
              <div className="space-y-2">
                {[
                  { id: "round" as GageType, emoji: "🍺", label: "Buys a round for everyone (default)" },
                  { id: "dare" as GageType, emoji: "🎭", label: "Does a dare chosen by other teams" },
                  { id: "custom" as GageType, emoji: "✏️", label: "Custom gage" },
                ].map(({ id, emoji, label }) => (
                  <button
                    key={id}
                    onClick={() => update("gageType", id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                      form.gageType === id
                        ? "border-poulet-gold bg-poulet-gold/10 text-poulet-gold"
                        : "border-poulet-feather/30 text-poulet-feather hover:border-poulet-gold"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="font-body text-sm">{label}</span>
                  </button>
                ))}
              </div>
              {form.gageType === "custom" && (
                <input
                  className="mt-3 w-full bg-transparent border border-poulet-feather/40 text-poulet-cream font-body px-4 py-3 focus:outline-none focus:border-poulet-gold transition-colors"
                  placeholder="Describe the gage..."
                  value={form.gageCustomText}
                  onChange={(e) => update("gageCustomText", e.target.value)}
                />
              )}
            </div>

            {/* Chaos Mode toggle */}
            <div className="flex items-center justify-between border border-poulet-feather/30 px-4 py-4 hover:border-poulet-gold transition-colors">
              <div>
                <div className="font-heading text-poulet-gold text-xl uppercase">
                  Chaos Mode ⚡
                </div>
                <div className="font-body text-poulet-feather text-sm">
                  Weapons, traps, and mayhem
                </div>
              </div>
              <button
                onClick={() => update("chaosMode", !form.chaosMode)}
                aria-label="Toggle Chaos Mode"
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  form.chaosMode ? "bg-poulet-gold shadow-gold" : "bg-poulet-feather/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                    form.chaosMode ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Communication rules */}
            <div className="border border-poulet-feather/20 p-4 space-y-3">
              <div className="font-mono text-poulet-feather text-xs uppercase mb-3">
                Communication Rules
              </div>
              {[
                { key: "allowCalls" as const, label: "Phone calls allowed" },
                { key: "allowTexts" as const, label: "Texts allowed" },
                { key: "allowHints" as const, label: "Chicken can give hints" },
                { key: "allowSocialMedia" as const, label: "Social media allowed" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-body text-poulet-cream/70 text-sm">{label}</span>
                  <button
                    onClick={() => update(key, !form[key])}
                    aria-label={label}
                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                      form[key] ? "bg-poulet-green" : "bg-poulet-feather/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                        form[key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Bar Areas */}
        {step === 4 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Best Areas 🍺</h1>
            <p className="font-body text-poulet-feather italic leading-relaxed">
              The Chicken picks their exact bar once the game starts. Here are the densest bar areas in <span className="text-poulet-gold">{form.city}</span> — share these with your group so everyone knows the hunting zone.
            </p>

            {loadingAreas ? (
              <div className="border border-poulet-feather/20 p-12 text-center">
                <div className="font-mono text-poulet-feather/50 text-sm animate-pulse">Loading bar data…</div>
              </div>
            ) : areas.length > 0 ? (
              <div className="space-y-3">
                {areas.map((area, i) => (
                  <div key={area.name} className="border border-poulet-feather/20 hover:border-poulet-gold/50 transition-all">
                    <button
                      onClick={() => setExpandedArea(expandedArea === area.name ? null : area.name)}
                      className="w-full flex items-center gap-4 px-4 py-4 text-left"
                    >
                      <div className={`w-7 h-7 flex items-center justify-center font-heading text-sm ${i === 0 ? "bg-poulet-gold text-poulet-black" : "border border-poulet-feather/40 text-poulet-feather"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-heading text-poulet-cream text-lg uppercase">{area.name}</div>
                        <div className="font-mono text-poulet-feather/50 text-xs">{area.bar_count} bars nearby</div>
                      </div>
                      <span className="text-poulet-feather/40 text-sm">{expandedArea === area.name ? "▾" : "▸"}</span>
                    </button>
                    {expandedArea === area.name && (
                      <div className="px-4 pb-4 border-t border-poulet-feather/10">
                        <div className="font-mono text-poulet-feather/50 text-xs uppercase mb-3 pt-3">Bars in this area</div>
                        <div className="grid grid-cols-2 gap-1">
                          {area.bars.slice(0, 10).map((bar) => (
                            <div key={bar.id} className="font-body text-poulet-cream/70 text-sm py-1">• {bar.name}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-poulet-feather/20 p-8 text-center space-y-3">
                <div className="text-4xl">🍺</div>
                <div className="font-heading text-poulet-gold text-xl uppercase">Bar data unavailable</div>
                <p className="font-body text-poulet-feather/60 text-sm">
                  No worries — the Chicken picks from a live map of nearby bars when the game starts.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "🗺️", label: "Private map for Chicken" },
                { icon: "⏱️", label: `${form.headStartMinutes}min head start` },
                { icon: "🔒", label: "Location locked once chosen" },
              ].map((item) => (
                <div key={item.label} className="border border-poulet-feather/20 p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-mono text-poulet-feather text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Costume */}
        {step === 5 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Chicken Suit</h1>
            <p className="font-body text-poulet-feather italic">
              The suit is optional but highly encouraged. It&apos;s funnier for everyone.
            </p>

            <div>
              <label className="font-mono text-poulet-feather text-xs uppercase mb-2 block">
                Costume Policy
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "required" as const, label: "Required" },
                  { id: "encouraged" as const, label: "Encouraged" },
                  { id: "optional" as const, label: "Optional" },
                  { id: "none" as const, label: "No Suit" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => update("costumePolicy", id)}
                    className={pillClass(form.costumePolicy === id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-mono text-poulet-feather text-xs uppercase mb-2">
                Popular Options
              </div>
              {[
                {
                  id: "full",
                  name: "Full Deluxe Suit",
                  price: "$65",
                  emoji: "🐔",
                  desc: "The full experience. Head to toe chicken. Maximum commitment.",
                },
                {
                  id: "head",
                  name: "Head Only",
                  price: "$14.99",
                  emoji: "🐔",
                  desc: "Budget-friendly. Maximum dignity loss. Minimum effort.",
                },
                {
                  id: "inflatable",
                  name: "Inflatable Suit",
                  price: "$29.99",
                  emoji: "🎈",
                  desc: "Round. Ridiculous. Genuinely perfect for this game.",
                },
              ].map((suit) => (
                <div
                  key={suit.id}
                  className="border border-poulet-feather/30 p-4 flex items-center gap-4 hover:border-poulet-gold transition-all cursor-default"
                >
                  <span className="text-4xl">{suit.emoji}</span>
                  <div className="flex-1">
                    <div className="font-heading text-poulet-gold text-lg uppercase">
                      {suit.name}
                    </div>
                    <div className="font-body text-poulet-feather text-sm">{suit.desc}</div>
                  </div>
                  <span className="font-mono text-poulet-gold text-sm">{suit.price}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(6)}
              className="w-full border border-poulet-feather/40 text-poulet-feather font-mono text-sm py-3 hover:border-poulet-gold hover:text-poulet-gold transition-all"
            >
              Already have one / Skip →
            </button>
          </div>
        )}

        {/* Step 6: Launch */}
        {step === 6 && (
          <div className="space-y-6">
            <h1 className="font-heading text-poulet-gold text-5xl uppercase">Ready?</h1>
            <p className="font-body text-poulet-feather italic">
              Review your settings and launch the hunt.
            </p>

            <div className="border border-poulet-gold bg-poulet-gold/5 p-6 space-y-3">
              {[
                { label: "Game Name", value: form.name || "Chicken Hunt" },
                { label: "City", value: form.city },
                { label: "Language", value: form.language === "en" ? "English" : "Français" },
                {
                  label: "Players",
                  value:
                    form.players.length > 0
                      ? form.players.map((p) => p.name).join(", ")
                      : "Link sharing",
                },
                { label: "Chickens", value: form.numChickens },
                { label: "Head Start", value: `${form.headStartMinutes} min` },
                { label: "Duration", value: `${form.gameDurationHours} hrs` },
                {
                  label: "Pot",
                  value: form.buyInAmount === 0 ? "Free night" : `$${form.buyInAmount}/person → $${totalPot} total`,
                },
                { label: "Chaos Mode", value: form.chaosMode ? "ON ⚡" : "Off" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start gap-4">
                  <span className="font-mono text-poulet-feather text-sm flex-shrink-0">
                    {item.label}
                  </span>
                  <span className="font-mono text-poulet-cream text-sm text-right">
                    {String(item.value)}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="border border-poulet-red bg-poulet-red/10 px-4 py-3 font-mono text-poulet-red text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLaunch}
              disabled={loading}
              className="w-full bg-poulet-gold text-poulet-black font-heading text-3xl py-6 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Hunt..." : "START THE HUNT 🐔"}
            </button>

            <p className="font-mono text-poulet-feather/50 text-xs text-center">
              A 6-letter game code will be generated. Share it with your friends.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="border border-poulet-feather/40 text-poulet-feather font-mono px-6 py-3 hover:border-poulet-gold hover:text-poulet-gold transition-all"
            >
              ← Back
            </button>
          )}
          {step < 6 && step !== 5 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-poulet-gold text-poulet-black font-heading text-xl py-3 uppercase hover:brightness-110 transition-all"
            >
              Next →
            </button>
          )}
          {step === 5 && (
            <button
              onClick={() => setStep(6)}
              className="flex-1 bg-poulet-gold text-poulet-black font-heading text-xl py-3 uppercase hover:brightness-110 transition-all"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
