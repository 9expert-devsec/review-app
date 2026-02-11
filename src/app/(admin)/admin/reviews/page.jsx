"use client";

import { useState } from "react";

export default function AdminReviewsPage() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
 
  async function syncCourses() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses/sync", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(`Sync fail: ${j?.error || res.status}`);
        return;
      }
      setMsg(
        `Sync ok: upstream=${j.upstreamCount}, parsed=${j.parsedCount}, upserted=${j.upserted}, modified=${j.modified}`,
      );
    } catch {
      setMsg("Sync fail: network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Reviews</h1>
          <p className="mt-2 text-slate-500">
            ตารางจัดการรีวิวจะทำต่อในขั้นถัดไป
          </p>
        </div>

        <button
          onClick={syncCourses}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          {loading ? "Syncing..." : "Sync Courses"}
        </button>
      </div>

      {msg && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {msg}
        </div>
      )}
    </div>
  );
}
