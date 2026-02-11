"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(j?.error || "Login failed");
    location.href = "/admin/reviews";
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-extrabold">Admin Login</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Password"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
