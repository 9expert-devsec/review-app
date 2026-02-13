"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function ReportsClient() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [active, setActive] = useState(""); // "" | "1" | "0"
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/courses", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j.ok) setCourses(j.items || []);
    })();
  }, []);

  const exportUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (courseId) sp.set("courseId", courseId);
    if (active !== "") sp.set("active", active);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return `/api/admin/reviews/export?${sp.toString()}`;
  }, [courseId, active, from, to]);

  function validate() {
    // ไม่บังคับ แต่กันพลาดเรื่องช่วงวัน
    if (from && to && from > to) {
      setErr("ช่วงวันที่ไม่ถูกต้อง: From ต้องไม่มากกว่า To");
      return false;
    }
    setErr("");
    return true;
  }

  function download() {
    if (!validate()) return;
    window.open(exportUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports Export</h1>
        <Link
          href="/admin/reviews"
          className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          กลับไป Reviews
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6">
        <div className="md:col-span-3">
          <div className="text-xs text-slate-500">Course</div>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <div className="text-xs text-slate-500">Active</div>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="1">Active</option>
            <option value="0">Off</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <div className="text-xs text-slate-500">From</div>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <div className="text-xs text-slate-500">To</div>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="md:col-span-6 flex items-center justify-end gap-2">
          <a
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
          >
            ทดสอบลิงก์ Export
          </a>
          <button
            onClick={download}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-500">
        ไฟล์ CSV มี BOM รองรับภาษาไทยใน Excel
      </div>
    </div>
  );
}
