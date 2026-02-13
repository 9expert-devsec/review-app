// src/app/api/admin/reviews/[id]/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import Course from "@/models/Course";
import { requireAdmin } from "@/lib/adminAuth.server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}
function cleanEmail(x) {
  return clean(x).toLowerCase();
}
function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}
function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function ensureCloudinaryEnv() {
  const cloud_name = clean(process.env.CLOUDINARY_CLOUD_NAME);
  const api_key = clean(process.env.CLOUDINARY_API_KEY);
  const api_secret = clean(process.env.CLOUDINARY_API_SECRET);
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Missing Cloudinary env");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
}

async function destroyCloudinary(publicId) {
  const pid = clean(publicId);
  if (!pid) return;
  ensureCloudinaryEnv();
  // destroy image
  await cloudinary.uploader.destroy(pid, { resource_type: "image" });
}

export async function GET(req, ctx) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await ctx.params;
    if (!isValidId(id)) return bad("Invalid id", 400);

    const item = await Review.findById(id).lean();
    if (!item) return bad("Not found", 404);

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return bad(e?.message || "Server error", e?.status || 500);
  }
}

export async function PUT(req, ctx) {
  try {
    const admin = await requireAdmin();
    await dbConnect();

    const { id } = await ctx.params;
    if (!isValidId(id)) return bad("Invalid id", 400);

    const body = await req.json().catch(() => ({}));
    const patch = {};
    const now = new Date();

    // ---- course ----
    if (body.courseId !== undefined) {
      const courseId = clean(body.courseId);
      if (!isValidId(courseId)) return bad("courseId invalid", 400);
      const c = await Course.findById(courseId).select("name").lean();
      if (!c) return bad("Course not found", 400);
      patch.courseId = courseId;
      patch.courseName = clean(c.name);
    }

    // ---- basic fields ----
    if (body.reviewerName !== undefined)
      patch.reviewerName = clean(body.reviewerName);

    if (body.reviewerEmail !== undefined) {
      const em = cleanEmail(body.reviewerEmail);
      if (!em) return bad("reviewerEmail invalid", 400);
      patch.reviewerEmail = clean(body.reviewerEmail);
      patch.reviewerEmailLower = em;
    }

    if (body.reviewerCompany !== undefined)
      patch.reviewerCompany = clean(body.reviewerCompany);
    if (body.reviewerRole !== undefined)
      patch.reviewerRole = clean(body.reviewerRole);

    if (body.headline !== undefined) patch.headline = clean(body.headline);
    if (body.comment !== undefined) patch.comment = clean(body.comment);

    if (body.rating !== undefined) {
      const r = Number(body.rating);
      if (!Number.isFinite(r) || r < 1 || r > 5)
        return bad("rating must be 1-5", 400);
      patch.rating = r;
    }

    if (body.isActive !== undefined) patch.isActive = !!body.isActive;

    // ---------------- Avatar (NEW) ----------------
    // รองรับ:
    // - { avatarAction: "remove" }  -> ลบรูปเดิมทั้งใน DB และ Cloudinary
    // - { avatarUrl, avatarPublicId } -> แทนที่รูปเดิม (ลบรูปเก่าบน Cloudinary ถ้ามี)
    const avatarAction = clean(body.avatarAction);

    // ต้องอ่านตัวเดิมก่อน เพื่อรู้ publicId เก่าไว้ลบ
    const existing = await Review.findById(id)
      .select("avatarUrl avatarPublicId")
      .lean();
    if (!existing) return bad("Not found", 404);

    if (avatarAction === "remove") {
      // ลบรูปเดิม
      if (existing.avatarPublicId) {
        await destroyCloudinary(existing.avatarPublicId);
      }
      patch.avatarUrl = "";
      patch.avatarPublicId = "";
    } else {
      // อัปเดตรูปใหม่ (ถ้าส่งมา)
      if (body.avatarUrl !== undefined || body.avatarPublicId !== undefined) {
        const nextUrl = clean(body.avatarUrl);
        const nextPid = clean(body.avatarPublicId);

        if (!nextUrl || !nextPid)
          return bad("avatarUrl/avatarPublicId required", 400);

        // ลบรูปเก่าถ้ามีและต่างจากอันใหม่
        if (existing.avatarPublicId && existing.avatarPublicId !== nextPid) {
          await destroyCloudinary(existing.avatarPublicId);
        }

        patch.avatarUrl = nextUrl;
        patch.avatarPublicId = nextPid;
      }
    }

    // optional: moderatedBy
    if (admin?.email) patch.moderatedBy = clean(admin.email);

    const item = await Review.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    if (!item) return bad("Not found", 404);

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return bad(e?.message || "Server error", e?.status || 500);
  }
}

export async function DELETE(req, ctx) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await ctx.params;
    if (!isValidId(id)) return bad("Invalid id", 400);

    const item = await Review.findByIdAndDelete(id).lean();
    if (!item) return bad("Not found", 404);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad(e?.message || "Server error", e?.status || 500);
  }
}
