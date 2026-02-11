import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import Course from "@/models/Course";
import { uploadBufferToCloudinary } from "@/lib/cloudinary.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req) {
  try {
    await dbConnect();

    const fd = await req.formData();

    const fullName = clean(fd.get("fullName"));
    const email = clean(fd.get("email")).toLowerCase();
    const company = clean(fd.get("company"));
    const jobTitle = clean(fd.get("jobTitle"));

    const courseId = clean(fd.get("courseId"));
    const stars = num(fd.get("stars"));
    const title = clean(fd.get("title"));
    const body = clean(fd.get("body"));

    const accepted = clean(fd.get("acceptedTerms")) === "true";

    if (!fullName || !email || !title || !body) {
      return NextResponse.json(
        { ok: false, error: "กรอกข้อมูลที่จำเป็นให้ครบ" },
        { status: 400 },
      );
    }
    if (!(stars >= 1 && stars <= 5)) {
      return NextResponse.json(
        { ok: false, error: "กรุณาให้คะแนน 1-5 ดาว" },
        { status: 400 },
      );
    }
    if (!accepted) {
      return NextResponse.json(
        { ok: false, error: "กรุณายอมรับข้อตกลงก่อนส่งรีวิว" },
        { status: 400 },
      );
    }

    // course snapshot
    let courseDoc = null;
    if (courseId) {
      courseDoc = await Course.findById(courseId).select({ name: 1 }).lean();
    }

    // avatar upload
    let avatar = { url: "", publicId: "" };
    const file = fd.get("avatar");
    if (
      file &&
      typeof file === "object" &&
      typeof file.arrayBuffer === "function"
    ) {
      const ab = await file.arrayBuffer();
      const buffer = Buffer.from(ab);

      // กันไฟล์ใหญ่เกิน (เช่น 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: "รูปใหญ่เกินไป (เกิน 5MB)" },
          { status: 400 },
        );
      }

      const up = await uploadBufferToCloudinary(buffer, {
        folder: "review-app/avatars",
      });

      avatar = { url: up.secure_url || "", publicId: up.public_id || "" };
    }

    const doc = await Review.create({
      fullName,
      email,
      company,
      jobTitle,
      avatar,

      courseId: courseDoc ? courseId : null,
      courseNameSnapshot: courseDoc?.name || "",

      stars,
      title,
      body,

      acceptedTermsAt: new Date(),

      status: "pending",
      isPublished: false,
      isFeatured: false,
      featuredOrder: 0,
    });

    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Submit failed" },
      { status: 500 },
    );
  }
}
