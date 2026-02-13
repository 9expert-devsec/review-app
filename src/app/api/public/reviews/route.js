import { NextResponse } from "next/server";
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

// หน้าแรกดึงรีวิวที่ “เปิด Active” แล้วเท่านั้น
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 12)),
    );

    const items = await Review.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 }) // ✅ เรียงตามลำดับก่อน แล้วค่อย createdAt
      .limit(limit)
      .select({
        reviewerName: 1,
        reviewerCompany: 1,
        reviewerRole: 1,
        courseName: 1,
        rating: 1,
        headline: 1,
        comment: 1,
        avatarUrl: 1,
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return NextResponse.json({
      ok: true,
      items: items.map((x) => ({ ...x, id: String(x._id) })),
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

    const headline = clean(body.headline || body.title);
    const comment = clean(body.comment || body.body);

    // ✅ FIX: ต้องประกาศให้ครบ (กัน ReferenceError)
    const avatarUrl = clean(body.avatarUrl);
    const avatarPublicId = clean(body.avatarPublicId);

    const consentAccepted = Boolean(body.consentAccepted ?? body.consent);

    if (!reviewerName || !reviewerEmail || !courseId || !headline || !comment) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
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
      courseName: course.name,

      reviewerName,
      reviewerEmail,
      reviewerEmailLower: toEmailLower(reviewerEmail),
      reviewerCompany,
      reviewerRole,

      rating,
      headline,
      comment,

      // ✅ บันทึกรูปให้ครบ 2 ฟิลด์
      avatarUrl,
      avatarPublicId,

      consentAccepted: true,
      consentAcceptedAt: new Date(),
      consentVersion: "v1",

      isActive: false,
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
