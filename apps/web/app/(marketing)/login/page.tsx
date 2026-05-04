"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@stores/authStore";
import type { AuthUser } from "@stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json() as { detail: string };
        setError(err.detail ?? "Login failed");
        return;
      }
      const data = await res.json() as AuthUser & { access_token: string };
      setAuth(data, data.access_token);
      router.push("/");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border border-poulet-feather/40 text-poulet-cream font-body px-4 py-3 focus:outline-none focus:border-poulet-gold transition-colors";

  return (
    <div className="min-h-screen bg-poulet-black flex items-center justify-center px-6 pt-14">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🐔</div>
          <h1 className="font-heading text-poulet-gold text-4xl uppercase">Sign In</h1>
          <p className="font-body text-poulet-feather mt-2 italic text-sm">Welcome back, hunter</p>
        </div>

        <div className="space-y-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
          />
          {error && <div className="font-mono text-poulet-red text-sm">{error}</div>}
          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </div>

        <div className="text-center space-y-3">
          <p className="font-mono text-poulet-feather text-sm">
            No account?{" "}
            <Link href="/register" className="text-poulet-gold hover:underline">
              Create one
            </Link>
          </p>
          <p className="font-mono text-poulet-feather/50 text-xs">
            Or{" "}
            <Link href="/join" className="hover:text-poulet-feather transition-colors">
              join a game as a guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
