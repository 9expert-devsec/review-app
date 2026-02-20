// src/app/api/public/reviews/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function toEmailLower(x) {
  return clean(x).toLowerCase();
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// หน้าแรกดึงรีวิวที่ “เปิด Active” + “approved” เท่านั้น
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 12)),
    );

    const items = await Review.find({ isActive: true })
      .sort({ pinnedAt: -1, createdAt: -1 }) // ✅ Active ที่กดล่าสุดขึ้นก่อน
      .limit(limit)
      .select({
        reviewerName: 1,
        reviewerCompany: 1,
        reviewerRole: 1,
        courseName: 1,
        rating: 1,

        body: 1,
        pinnedAt: 1,

        // legacy กันข้อมูลเก่า
        comment: 1,
        headline: 1,

        avatarUrl: 1,
        createdAt: 1,
      })
      .lean();

    return NextResponse.json({
      ok: true,
      items: items.map((x) => ({
        ...x,
        id: String(x._id),
        // ✅ ส่ง reviewText กลางให้หน้าเว็บใช้ได้ง่าย
        reviewText: clean(x.body || x.comment || ""),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || "Load failed") },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const reviewerName = clean(body.reviewerName || body.fullName);
    const reviewerEmail = clean(body.reviewerEmail || body.email);
    const reviewerCompany = clean(body.reviewerCompany || body.company);
    const reviewerRole = clean(body.reviewerRole || body.jobTitle);

    const courseId = clean(body.courseId);
    const rating = Number(body.rating);

    // ✅ ใหม่: ไม่ใช้ headline/title แล้ว
    const reviewText = clean(body.body || body.comment);

    // ✅ FIX: ต้องประกาศให้ครบ (กัน ReferenceError)
    const avatarUrl = clean(body.avatarUrl);
    const avatarPublicId = clean(body.avatarPublicId);

    const consentAccepted = Boolean(body.consentAccepted ?? body.consent);

    if (!reviewerName || !reviewerEmail || !courseId || !reviewText) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!isValidId(courseId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid courseId" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Invalid rating" },
        { status: 400 },
      );
    }

    if (!consentAccepted) {
      return NextResponse.json(
        { ok: false, error: "Consent is required" },
        { status: 400 },
      );
    }

    const course = await Course.findById(courseId).select({ name: 1 }).lean();
    if (!course) {
      return NextResponse.json(
        { ok: false, error: "Course not found" },
        { status: 400 },
      );
    }

    const doc = await Review.create({
      courseId,
      courseName: clean(course.name),

      reviewerName,
      reviewerEmail,
      reviewerEmailLower: toEmailLower(reviewerEmail),
      reviewerCompany,
      reviewerRole,

      rating,

      // ✅ ใหม่: เก็บไว้ที่ body เป็นหลัก
      body: reviewText,

      // legacy: กันของเก่าพัง (admin list/search/export ยังอ่านได้)
      comment: reviewText,
      headline: "",

      // รูป
      avatarUrl,
      avatarPublicId,

      consentAccepted: true,
      consentAcceptedAt: new Date(),
      consentVersion: "v1",

      isActive: false,
      pinnedAt: null,
      source: "public",
      status: "pending",
    });

    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || "Submit failed") },
      { status: 500 },
    );
  }
}
