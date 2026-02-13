"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      <span
        className={cx(
          "size-2 rounded-full",
          on ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
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
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Preview Review</div>
              <div className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 line-clamp-2">
                {item.headline || item.title || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {item.courseName || "-"} • {formatBKK(item.createdAt)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              ปิด
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
            <Link
              href={`/admin/reviews/${item._id}`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              แก้ไข
            </Link>
            <button
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
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
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
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
            className={cx(
              "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              loading
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
            )}
          >
            ⟳ Refresh
          </button>

          <Link
            href="/admin/reports"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
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
      <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Filters</div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-xs font-semibold text-slate-600">Course</div>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              type="date"
              value={fromUI}
              onChange={(e) => setFromUI(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-slate-600">To</div>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              type="date"
              value={toUI}
              onChange={(e) => setToUI(e.target.value)}
            />
          </div>

          <div className="md:col-span-6 flex items-end gap-2">
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-slate-600">Result</div>
              <div className="mt-1 text-sm text-slate-700">
                {nfmt(total)} รายการ • หน้า {page}/{pageCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              ไม่พบรีวิวตามเงื่อนไขที่เลือก
            </div>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it._id}
              className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50/60"
            >
              <div className="col-span-1 text-slate-600">
                {formatBKK(it.createdAt)}
              </div>

              <div className="col-span-3">
                <div className="font-semibold text-slate-900 line-clamp-1">
                  {it.courseName || "-"}
                </div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {it.reviewerCompany || ""}
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-semibold text-slate-900 line-clamp-1">
                  {it.reviewerName || "-"}
                </div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {it.reviewerEmail || ""}
                </div>
              </div>

              <div className="col-span-1 text-center">
                <div className="font-extrabold text-slate-900">
                  {Number(it.rating || 0)}
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  {stars(it.rating)}
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-semibold text-slate-900 line-clamp-1">
                  {it.headline || "-"}
                </div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {it.comment || ""}
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <button
                  onClick={() => toggleActive(it._id, !it.isActive)}
                  className="hover:opacity-90"
                  title="กดเพื่อสลับสถานะ Active/Off"
                >
                  <Badge on={!!it.isActive} />
                </button>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => setPreview(it)}
                >
                  ดู
                </button>
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  href={`/admin/reviews/${it._id}`}
                >
                  แก้ไข
                </Link>
                <button
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  onClick={() => remove(it._id)}
                >
                  ลบ
                </button>
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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <button
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>

      {/* Preview modal */}
      <Modal open={!!preview} item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
