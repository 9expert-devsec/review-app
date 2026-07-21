"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setErr("");
      const r = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.error || "Login failed");
      const KEY = (process.env.ADMIN_PATH_KEY || "").trim();
      router.push(`${KEY}/admin/dashboard`);
    } catch (e2) {
      setErr(e2.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-ice p-6 text-brand-navy">
      {/* Subtle branded background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, color-mix(in srgb, var(--brand-sky) 18%, transparent), transparent 60%)",
        }}
      />

      <form
        onSubmit={onSubmit}
        className="card relative w-full max-w-md p-7 sm:p-8"
      >
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo/9exp-stand.png"
            alt="9Expert"
            width={56}
            height={56}
            priority
            className="rounded-2xl"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-navy">
            9<span className="text-brand-blue-bright">Expert</span> Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            เข้าสู่ระบบเพื่อจัดการรีวิว
          </p>
        </div>

        {err && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10!"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@9expert.co.th"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10!"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <button disabled={loading} className="btn-primary mt-6 w-full py-2.5!">
          <LogIn className="size-4" />
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
