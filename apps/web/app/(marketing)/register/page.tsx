"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@stores/authStore";
import type { AuthUser } from "@stores/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", username: "", display_name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.display_name || !form.password) {
      setError("All fields required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json() as { detail: string };
        setError(err.detail ?? "Registration failed");
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
          <h1 className="font-heading text-poulet-gold text-4xl uppercase">Join the Hunt</h1>
          <p className="font-body text-poulet-feather mt-2 italic text-sm">Create your hunter profile</p>
        </div>

        <div className="space-y-4">
          <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input className={inputClass} placeholder="Username (e.g. foxy_marie)" value={form.username} onChange={(e) => update("username", e.target.value)} />
          <input className={inputClass} placeholder="Display name" value={form.display_name} onChange={(e) => update("display_name", e.target.value)} />
          <input className={inputClass} type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} onKeyDown={(e) => e.key === "Enter" && void handleRegister()} />
          {error && <div className="font-mono text-poulet-red text-sm">{error}</div>}
          <button
            onClick={() => void handleRegister()}
            disabled={loading}
            className="w-full bg-poulet-gold text-poulet-black font-heading text-xl py-4 uppercase hover:brightness-110 active:scale-95 transition-all shadow-gold disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </div>

        <p className="text-center font-mono text-poulet-feather text-sm">
          Already have one?{" "}
          <Link href="/login" className="text-poulet-gold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
