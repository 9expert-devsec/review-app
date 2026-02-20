// src/app/api/admin/reviews/export/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import { requireAdmin } from "@/lib/adminAuth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatBKK(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function parseBkkRange(from, to) {
  // input: YYYY-MM-DD (BKK)
  const out = {};
  if (from) out.$gte = new Date(`${from}T00:00:00.000+07:00`);
  if (to) out.$lte = new Date(`${to}T23:59:59.999+07:00`);
  return Object.keys(out).length ? out : null;
}

export async function GET(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const courseId = clean(searchParams.get("courseId"));
    const active = clean(searchParams.get("active")); // 1/0
    const from = clean(searchParams.get("from"));
    const to = clean(searchParams.get("to"));

    const where = {};
    if (courseId) where.courseId = courseId;
    if (active === "1") where.isActive = true;
    if (active === "0") where.isActive = false;

    const range = parseBkkRange(from, to);
    if (range) where.createdAt = range;

    const items = await Review.find(where)
      .sort({ isActive: -1, pinnedAt: -1, createdAt: -1 })
      .lean();

    const header = [
      "createdAt(BKK)",
      "courseName",
      "rating",
      "reviewerName",
      "reviewerCompany",
      "reviewerRole",
      "body",
      "isActive",
    ];

    const rows = items.map((it) => [
      formatBKK(it.createdAt),
      it.courseName || "",
      it.rating ?? "",
      it.reviewerName || "",
      it.reviewerCompany || "",
      it.reviewerRole || "",
      (it.body || it.comment || "").trim(),
      it.isActive ? "1" : "0",
    ]);

    const csv =
      "\uFEFF" +
      [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reviews_export.csv"`,
      },
    });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status },
    );
  }
}
