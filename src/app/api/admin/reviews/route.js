// src/app/api/admin/reviews/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import Course from "@/models/Course";
import { requireAdmin } from "@/lib/adminAuth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}
function cleanEmail(x) {
  return clean(x).toLowerCase();
}
function toInt(x, d) {
  const n = Number(x);
  return Number.isFinite(n) ? Math.floor(n) : d;
}
function escapeRegExp(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isValidId(id) {
  return mongoose.isValidObjectId(id);
}
function parseBkkRange(from, to) {
  // input: YYYY-MM-DD
  const out = {};
  if (from) out.$gte = new Date(`${from}T00:00:00.000+07:00`);
  if (to) out.$lte = new Date(`${to}T23:59:59.999+07:00`);
  return Object.keys(out).length ? out : null;
}
function normalizeStatus(x) {
  const v = clean(x);
  if (v === "pending" || v === "approved" || v === "rejected") return v;
  return "";
}

export async function GET(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInt(searchParams.get("page"), 1));
    const limit = Math.min(
      100,
      Math.max(10, toInt(searchParams.get("limit"), 20)),
    );
    const skip = (page - 1) * limit;

    const courseId = clean(searchParams.get("courseId"));
    const active = clean(searchParams.get("active")); // "1"|"0"|"" (คุม isActive)
    const status = normalizeStatus(searchParams.get("status")); // pending|approved|rejected|""
    const q = clean(searchParams.get("q"));
    const from = clean(searchParams.get("from"));
    const to = clean(searchParams.get("to"));

    const where = {};

    if (courseId) {
      if (!isValidId(courseId)) {
        return NextResponse.json(
          { ok: false, error: "courseId invalid" },
          { status: 400 },
        );
      }
      where.courseId = courseId;
    }

    if (active === "1") where.isActive = true;
    if (active === "0") where.isActive = false;

    if (status) where.status = status;

    if (q) {
      const re = new RegExp(escapeRegExp(q), "i");
      const em = cleanEmail(q);
      where.$or = [
        { reviewerName: re },
        { reviewerCompany: re },
        { reviewerRole: re },
        { headline: re },
        { comment: re },
        { courseName: re },
        { reviewerEmailLower: new RegExp(escapeRegExp(em), "i") },
      ];
    }

    const range = parseBkkRange(from, to);
    if (range) where.createdAt = range;

    const [total, items] = await Promise.all([
      Review.countDocuments(where),
      Review.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          courseId: 1,
          courseName: 1,
          reviewerName: 1,
          reviewerEmail: 1,
          reviewerEmailLower: 1,
          reviewerCompany: 1,
          reviewerRole: 1,
          rating: 1,
          headline: 1,
          comment: 1,
          status: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,

          displayOrder: 1,
          avatarUrl: 1,
          avatarPublicId: 1,
        })
        .lean(),
    ]);

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((x) => ({ ...x, id: String(x._id) })),
    });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status },
    );
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await req.json().catch(() => ({}));

    const courseId = clean(body.courseId);
    const rating = Number(body.rating);

    const reviewerName = clean(body.reviewerName);
    const reviewerEmail = clean(body.reviewerEmail);
    const reviewerEmailLower = cleanEmail(body.reviewerEmail);

    const headline = clean(body.headline);
    const comment = clean(body.comment);

    if (!courseId || !isValidId(courseId)) {
      return NextResponse.json(
        { ok: false, error: "courseId required" },
        { status: 400 },
      );
    }
    if (!reviewerName || !reviewerEmailLower || !headline) {
      return NextResponse.json(
        { ok: false, error: "reviewerName/reviewerEmail/headline required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "rating must be 1-5" },
        { status: 400 },
      );
    }

    const c = await Course.findById(courseId).select("name").lean();
    if (!c) {
      return NextResponse.json(
        { ok: false, error: "Course not found" },
        { status: 400 },
      );
    }

    const status = normalizeStatus(body.status) || "approved"; // admin สร้างเองให้ approved ได้
    const isActive = !!body.isActive;

    const consentAccepted = !!body.consentAccepted;
    const consentAcceptedAt = consentAccepted ? new Date() : null;
    const consentVersion = clean(body.consentVersion) || "v1";

    const doc = await Review.create({
      courseId,
      courseName: clean(c.name),

      reviewerName,
      reviewerEmail,
      reviewerEmailLower,
      reviewerCompany: clean(body.reviewerCompany),
      reviewerRole: clean(body.reviewerRole),

      rating,
      headline,
      comment,

      avatarUrl: clean(body.avatarUrl),
      avatarPublicId: clean(body.avatarPublicId),

      consentAccepted,
      consentAcceptedAt,
      consentVersion,

      status,
      statusUpdatedAt: new Date(),

      isActive,
      source: "admin",
    });

    return NextResponse.json({ ok: true, item: doc });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status },
    );
  }
}
