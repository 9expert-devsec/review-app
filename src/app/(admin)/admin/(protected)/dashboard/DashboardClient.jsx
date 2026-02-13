"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmt(n, d = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toFixed(d);
}

function nfmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("en-US");
}

function pct(n, total) {
  const a = Number(n);
  const t = Number(total);
  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.max(0, Math.min(100, (a / t) * 100));
}

function IconPill({ children }) {
  return (
    <div className="grid size-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500">{hint}</div>
          ) : null}
        </div>
        <IconPill>{icon}</IconPill>
      </div>
    </div>
  );
}

function SectionCard({ title, right, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-slate-900">{title}</div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-44 rounded-xl bg-slate-200" />
      <div className="mt-2 h-4 w-72 rounded-xl bg-slate-200" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className="h-4 w-full rounded bg-slate-200" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAt, setLastAt] = useState(null);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const r = await fetch("/api/admin/reviews/stats", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "load failed");
      setData(j);
      setLastAt(new Date());
    } catch (e) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = data?.totals || {
    totalReviews: 0,
    activeReviews: 0,
    avgRating: 0,
  };
  const totalReviews = Number(totals.totalReviews || 0);
  const ratingDist = Array.isArray(data?.ratingDist) ? data.ratingDist : [];
  const perCourse = Array.isArray(data?.perCourse) ? data.perCourse : [];

  const maxRatingCount = useMemo(() => {
    const m = ratingDist.reduce(
      (acc, x) => Math.max(acc, Number(x?.count || 0)),
      0,
    );
    return m > 0 ? m : 1;
  }, [ratingDist]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </div>
          <div className="mt-1 text-sm text-slate-500">
            ภาพรวมสถิติรีวิว • อัปเดตล่าสุด{" "}
            {lastAt ? (
              <span className="font-medium text-slate-700">
                {lastAt.toLocaleString("th-TH")}
              </span>
            ) : (
              "-"
            )}
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
            href="/admin/reviews"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ไปหน้า Reviews
          </Link>

          <Link
            href="/admin/reports"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ไปหน้า Reports
          </Link>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      )}

      {/* Loading */}
      {!data && loading ? (
        <div className="mt-6">
          <Skeleton />
        </div>
      ) : !data ? (
        <div className="mt-6 text-slate-500">Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon="Σ"
              label="Total Reviews"
              value={nfmt(totals.totalReviews)}
              hint="รวมทั้งหมดในระบบ"
            />
            <StatCard
              icon="✓"
              label="Active Reviews"
              value={nfmt(totals.activeReviews)}
              hint="ที่เปิดแสดงหน้าเว็บ"
            />
            <StatCard
              icon="★"
              label="Average Rating"
              value={fmt(totals.avgRating)}
              hint="เฉลี่ยจากรีวิวทั้งหมด"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Rating Distribution */}
            <SectionCard
              title="Rating Distribution"
              right={
                <div className="text-xs text-slate-500">
                  Total:{" "}
                  <span className="font-semibold text-slate-700">
                    {nfmt(totalReviews)}
                  </span>
                </div>
              }
            >
              {totalReviews <= 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  ยังไม่มีรีวิวในระบบ — ลองเพิ่มรีวิวจากหน้า public
                  แล้วกลับมาดูสถิติได้เลย
                </div>
              ) : (
                <div className="space-y-3">
                  {ratingDist.map((x) => {
                    const r = Number(x?.rating || 0);
                    const c = Number(x?.count || 0);
                    const width = Math.round((c / maxRatingCount) * 100);
                    const p = Math.round(pct(c, totalReviews));
                    return (
                      <div key={r} className="flex items-center gap-3">
                        <div className="w-14 text-sm font-medium text-slate-700">
                          {r} ดาว
                        </div>

                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-slate-900"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-slate-500">
                            <span>{nfmt(c)} รีวิว</span>
                            <span>{p}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Courses */}
            <SectionCard
              title="Courses (Reviews count)"
              right={
                <div className="text-xs text-slate-500">
                  แสดง Top 10 ตามจำนวนรีวิว
                </div>
              }
            >
              {perCourse.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  ยังไม่มีข้อมูลรีวิวแยกตามคอร์ส
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                    <div className="col-span-7">Course</div>
                    <div className="col-span-2 text-right">Reviews</div>
                    <div className="col-span-1 text-right">Active</div>
                    <div className="col-span-2 text-right">Avg</div>
                  </div>

                  <div className="divide-y">
                    {perCourse.slice(0, 10).map((c) => {
                      const reviewCount = Number(c?.reviewCount || 0);
                      const activeCount = Number(c?.activeCount || 0);
                      const avgRating = Number(c?.avgRating || 0);

                      const activeP =
                        reviewCount > 0
                          ? Math.round((activeCount / reviewCount) * 100)
                          : 0;

                      return (
                        <div
                          key={String(c.courseId)}
                          className="grid grid-cols-12 gap-3 px-4 py-3 text-sm"
                        >
                          <div className="col-span-12 md:col-span-7">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {c.courseName || "-"}
                            </div>
                            <div className="mt-1">
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-slate-900"
                                  style={{ width: `${activeP}%` }}
                                />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Active {nfmt(activeCount)} / {nfmt(reviewCount)}{" "}
                                ({activeP}%)
                              </div>
                            </div>
                          </div>

                          <div className="col-span-4 md:col-span-2 text-right font-semibold text-slate-900">
                            {nfmt(reviewCount)}
                          </div>
                          <div className="col-span-4 md:col-span-1 text-right text-slate-700">
                            {nfmt(activeCount)}
                          </div>
                          <div className="col-span-4 md:col-span-2 text-right font-semibold text-slate-900">
                            {fmt(avgRating)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
