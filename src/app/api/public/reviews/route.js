import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}
function toEmail(x) {
  return clean(x).toLowerCase();
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const fullName = clean(body.fullName);
    const email = toEmail(body.email);
    const company = clean(body.company);
    const jobTitle = clean(body.jobTitle);

    const courseId = clean(body.courseId);
    const rating = Number(body.rating);

    const title = clean(body.title);
    const reviewBody = clean(body.body);

    const avatarUrl = clean(body.avatarUrl);
    const avatarPublicId = clean(body.avatarPublicId);

    const consent = Boolean(body.consent);

    if (!fullName || !email || !courseId || !title || !reviewBody) {
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
    if (!consent) {
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
      fullName,
      email,
      company,
      jobTitle,
      courseId,
      courseName: course.name, // snapshot
      rating,
      title,
      body: reviewBody,
      avatarUrl,
      avatarPublicId,
      consent,
      status: "pending",
      isPublished: false,
      isFeatured: false,
    });

    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Submit failed" },
      { status: 500 },
    );
  }
}

// ใช้หน้าแรกดึงรีวิวที่ publish แล้ว
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 12)),
    );
    const featuredOnly = searchParams.get("featured") === "1";

    const where = { isPublished: true, status: "approved" };
    if (featuredOnly) where.isFeatured = true;

    const items = await Review.find(where)
      .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .select({
        fullName: 1,
        company: 1,
        jobTitle: 1,
        courseName: 1,
        rating: 1,
        title: 1,
        body: 1,
        avatarUrl: 1,
        publishedAt: 1,
      })
      .lean();

    return NextResponse.json({
      ok: true,
      items: items.map((x) => ({ ...x, id: String(x._id) })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Load failed" },
      { status: 500 },
    );
  }
}
