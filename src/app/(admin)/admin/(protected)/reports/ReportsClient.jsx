"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  AlertCircle,
  FileSpreadsheet,
  Info,
} from "lucide-react";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy">
            Reports Export
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ดาวน์โหลดรีวิวเป็นไฟล์ CSV ตามเงื่อนไขที่เลือก
          </p>
        </div>
        <Link href="/admin/reviews" className="btn-ghost self-start sm:self-auto">
          <ArrowLeft className="size-4" />
          กลับไป Reviews
        </Link>
      </div>

      {err && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="card mt-6 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
          <FileSpreadsheet className="size-4 text-brand-blue" />
          ตัวกรองการ Export
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">Course</div>
            <select
              className="input mt-1"
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
            <div className="text-xs font-semibold text-slate-600">Active</div>
            <select
              className="input mt-1"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="1">Active</option>
              <option value="0">Off</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">From</div>
            <input
              className="input mt-1"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">To</div>
            <input
              className="input mt-1"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="md:col-span-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <a
              className="btn-ghost"
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-4" />
              ทดสอบลิงก์ Export
            </a>
            <button onClick={download} className="btn-primary">
              <Download className="size-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <Info className="size-4 shrink-0 text-brand-sky" />
        ไฟล์ CSV มี BOM รองรับภาษาไทยใน Excel
      </div>
    </div>
  );
}
