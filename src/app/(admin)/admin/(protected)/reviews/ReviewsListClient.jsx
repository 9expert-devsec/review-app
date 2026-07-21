"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function formatBKK(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function nfmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("en-US");
}

function stars(rating) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = "★★★★★".slice(0, n);
  const empty = "☆☆☆☆☆".slice(0, 5 - n);
  return full + empty;
}

function Badge({ on }) {
  return (
    <span className={cx("badge", on ? "badge-active" : "badge-muted")}>
      <span className="badge-dot" />
      {on ? "Active" : "Off"}
    </span>
  );
}

function Modal({ open, onClose, item }) {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[90vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Preview Review</div>
              <div className="mt-1 text-lg font-extrabold tracking-tight text-brand-navy line-clamp-2">
                {item.headline || item.title || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {item.courseName || "-"} • {formatBKK(item.createdAt)}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50"
            >
              <X className="size-4.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">
                ผู้รีวิว
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {item.reviewerName || item.fullName || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {item.reviewerEmail || item.email || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {item.reviewerCompany || item.company || ""}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">คะแนน</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {Number(item.rating || 0)}{" "}
                <span className="ml-2 text-sm font-semibold text-slate-700">
                  {stars(item.rating)}
                </span>
              </div>
              <div className="mt-2">
                <Badge on={!!item.isActive} />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-600">
              รายละเอียด/คำติชม
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {item.comment || item.body || "-"}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Link href={`/admin/reviews/${item._id}`} className="btn-ghost">
              <Pencil className="size-4" />
              แก้ไข
            </Link>
            <button onClick={onClose} className="btn-primary">
              เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsListClient() {
  const [courses, setCourses] = useState([]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // filters (UI inputs)
  const [courseIdUI, setCourseIdUI] = useState("");
  const [activeUI, setActiveUI] = useState(""); // "" | "1" | "0"
  const [qUI, setQUI] = useState("");
  const [fromUI, setFromUI] = useState("");
  const [toUI, setToUI] = useState("");

  // filters (applied)
  const [courseId, setCourseId] = useState("");
  const [active, setActive] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [lastAt, setLastAt] = useState(null);

  const [preview, setPreview] = useState(null);

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("limit", String(limit));
    if (courseId) sp.set("courseId", courseId);
    if (active !== "") sp.set("active", active);
    if (q.trim()) sp.set("q", q.trim());
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp.toString();
  }, [page, courseId, active, q, from, to]);

  async function loadCourses() {
    try {
      const r = await fetch("/api/admin/courses", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j.ok) setCourses(j.items || []);
    } catch {}
  }

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const r = await fetch(`/api/admin/reviews?${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.error || "Load failed");

      const nextTotal = Number(j.total || 0);
      const nextPageCount = Math.max(1, Math.ceil(nextTotal / limit));

      // clamp page if out-of-range (เช่นลบรายการหน้าสุดท้าย)
      if (page > nextPageCount) {
        setPage(nextPageCount);
        return;
      }

      setItems(j.items || []);
      setTotal(nextTotal);
      setLastAt(new Date());
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  function applyFilters() {
    setPage(1);
    setCourseId(courseIdUI);
    setActive(activeUI);
    setQ(qUI.trim());
    setFrom(fromUI);
    setTo(toUI);
  }

  function clearFilters() {
    setPage(1);

    setCourseIdUI("");
    setActiveUI("");
    setQUI("");
    setFromUI("");
    setToUI("");

    setCourseId("");
    setActive("");
    setQ("");
    setFrom("");
    setTo("");
  }

  async function toggleActive(id, next) {
    // optimistic
    setItems((prev) =>
      prev.map((x) => (x._id === id ? { ...x, isActive: next } : x)),
    );

    const r = await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) {
      alert(j.error || "Update failed");
      // rollback by reload
      load();
      return;
    }
    setItems((prev) => prev.map((x) => (x._id === id ? j.item : x)));
  }

  async function remove(id) {
    if (!confirm("ยืนยันลบรีวิวนี้?")) return;
    const r = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return alert(j.error || "Delete failed");
    load();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-head text-2xl font-extrabold tracking-tight text-brand-navy">
            Reviews
          </div>
          <div className="mt-1 text-sm text-slate-500">
            จัดการรีวิวทั้งหมด • ทั้งหมด{" "}
            <span className="font-semibold text-slate-700">{nfmt(total)}</span>{" "}
            รายการ • อัปเดตล่าสุด{" "}
            <span className="font-medium text-slate-700">
              {lastAt ? lastAt.toLocaleString("th-TH") : "-"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cx("size-4", loading && "animate-spin")} />
            Refresh
          </button>

          <Link href="/admin/reports" className="btn-ghost">
            <FileDown className="size-4" />
            ไปหน้า Export
          </Link>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      )}

      {/* Filters */}
      <div className="card mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <SlidersHorizontal className="size-4 text-brand-blue" />
            Filters
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearFilters} className="btn-ghost">
              Clear
            </button>
            <button onClick={applyFilters} className="btn-primary">
              Apply
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-xs font-semibold text-slate-600">Course</div>
            <select
              className="input mt-1"
              value={courseIdUI}
              onChange={(e) => setCourseIdUI(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {courses.map((c) => (
                <option
                  key={String(c._id || c.id)}
                  value={String(c._id || c.id)}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Active</div>
            <select
              className="input mt-1"
              value={activeUI}
              onChange={(e) => setActiveUI(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="1">Active</option>
              <option value="0">Off</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <div className="text-xs font-semibold text-slate-600">Search</div>
            <input
              className="input mt-1"
              placeholder="ชื่อ/อีเมล/หัวข้อ/คำติชม"
              value={qUI}
              onChange={(e) => setQUI(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
            <div className="mt-1 text-xs text-slate-500">
              กด Enter เพื่อ Apply ได้
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">From</div>
            <input
              className="input mt-1"
              type="date"
              value={fromUI}
              onChange={(e) => setFromUI(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">To</div>
            <input
              className="input mt-1"
              type="date"
              value={toUI}
              onChange={(e) => setToUI(e.target.value)}
            />
          </div>

          <div className="md:col-span-6 flex items-end gap-2">
            <div className="flex-1 rounded-xl border border-slate-200 bg-brand-ice px-4 py-3">
              <div className="text-xs font-semibold text-slate-600">Result</div>
              <div className="mt-1 text-sm text-slate-700">
                {nfmt(total)} รายการ • หน้า {page}/{pageCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-6 overflow-hidden">
        {/* Desktop column header */}
        <div className="hidden grid-cols-12 gap-2 border-b border-slate-200 bg-brand-ice px-4 py-3 text-xs font-semibold text-slate-600 md:grid">
          <div className="col-span-1">วันที่</div>
          <div className="col-span-3">หลักสูตร</div>
          <div className="col-span-2">ผู้รีวิว</div>
          <div className="col-span-1 text-center">ดาว</div>
          <div className="col-span-2">หัวข้อ</div>
          <div className="col-span-1 text-center">สถานะ</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-5 text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-brand-ice p-8 text-center text-sm text-slate-500">
              ไม่พบรีวิวตามเงื่อนไขที่เลือก
            </div>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it._id}
              className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-brand-ice"
            >
              {/* ---------- Mobile card ---------- */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-brand-navy line-clamp-1">
                      {it.reviewerName || "-"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {it.reviewerEmail || ""}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(it._id, !it.isActive)}
                    className="shrink-0 transition-all active:scale-95"
                    title="กดเพื่อสลับสถานะ Active/Off"
                  >
                    <Badge on={!!it.isActive} />
                  </button>
                </div>

                <div className="rounded-xl bg-brand-ice p-3">
                  <div className="text-sm font-semibold text-brand-navy line-clamp-1">
                    {it.courseName || "-"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-brand-blue">
                      {Number(it.rating || 0)}
                    </span>
                    <span className="text-slate-500">{stars(it.rating)}</span>
                    {it.reviewerCompany ? (
                      <span className="truncate text-slate-400">
                        • {it.reviewerCompany}
                      </span>
                    ) : null}
                  </div>
                  {it.headline ? (
                    <div className="mt-2 text-sm font-medium text-slate-700 line-clamp-2">
                      {it.headline}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    {formatBKK(it.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost min-h-9! px-3! text-xs!"
                      onClick={() => setPreview(it)}
                    >
                      <Eye className="size-4" />
                      ดู
                    </button>
                    <Link
                      className="btn-ghost min-h-9! px-3! text-xs!"
                      href={`/admin/reviews/${it._id}`}
                    >
                      <Pencil className="size-4" />
                      แก้ไข
                    </Link>
                    <button
                      className="btn-danger min-h-9! px-3! text-xs!"
                      onClick={() => remove(it._id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ---------- Desktop grid row ---------- */}
              <div className="hidden grid-cols-12 gap-2 px-4 py-3 text-sm md:grid">
                <div className="col-span-1 text-slate-600">
                  {formatBKK(it.createdAt)}
                </div>

                <div className="col-span-3">
                  <div className="font-semibold text-brand-navy line-clamp-1">
                    {it.courseName || "-"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {it.reviewerCompany || ""}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="font-semibold text-brand-navy line-clamp-1">
                    {it.reviewerName || "-"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {it.reviewerEmail || ""}
                  </div>
                </div>

                <div className="col-span-1 text-center">
                  <div className="font-extrabold text-brand-blue">
                    {Number(it.rating || 0)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {stars(it.rating)}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="font-semibold text-brand-navy line-clamp-1">
                    {it.headline || "-"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {it.comment || ""}
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => toggleActive(it._id, !it.isActive)}
                    className="transition-all hover:opacity-90 active:scale-95"
                    title="กดเพื่อสลับสถานะ Active/Off"
                  >
                    <Badge on={!!it.isActive} />
                  </button>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-brand-blue"
                    onClick={() => setPreview(it)}
                    title="ดู"
                  >
                    <Eye className="size-4" />
                  </button>
                  <Link
                    className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-brand-blue"
                    href={`/admin/reviews/${it._id}`}
                    title="แก้ไข"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    className="grid size-9 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-all hover:bg-red-100"
                    onClick={() => remove(it._id)}
                    title="ลบ"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          {nfmt(total)} รายการ • หน้า {page}/{pageCount}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-ghost disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            ก่อนหน้า
          </button>
          <button
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="btn-ghost disabled:opacity-50"
          >
            ถัดไป
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Preview modal */}
      <Modal open={!!preview} item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
