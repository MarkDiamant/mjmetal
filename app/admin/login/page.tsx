"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Unable to sign in");
      setLoading(false);
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] px-5 py-12 text-[#141414]">
      <div className="mx-auto max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-[0_14px_50px_rgba(0,0,0,0.08)] sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">Business Software</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">Secure access for authorised users.</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#e66a24]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" autoComplete="current-password" className="h-12 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#e66a24]" />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#e66a24] font-black text-white disabled:opacity-50">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
