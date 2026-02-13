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
function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}
function isValidId(id) {
  return mongoose.isValidObjectId(id);
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
    const admin = await requireAdmin(); // ถ้า requireAdmin คืนข้อมูลผู้ใช้ได้ จะเอาไว้ใส่ moderatedBy
    await dbConnect();

    const { id } = await ctx.params;
    if (!isValidId(id)) return bad("Invalid id", 400);

    const body = await req.json().catch(() => ({}));
    const patch = {};
    const now = new Date();

    if (body.displayOrder !== undefined) {
      const n = Number(body.displayOrder);
      if (!Number.isFinite(n)) return bad("displayOrder invalid", 400);
      patch.displayOrder = Math.max(0, Math.min(9999, Math.floor(n)));
    }

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

    // ---- moderation: action or status ----
    // รองรับ 2 แบบ:
    // 1) { action: "approve" } หรือ { action:"reject", reason:"..." }
    // 2) { status: "approved" | "rejected" | "pending", rejectReason? }
    const action = clean(body.action);
    const status = clean(body.status);

    if (action) {
      if (action === "approve") {
        patch.status = "approved";
        patch.statusUpdatedAt = now;
        patch.approvedAt = now;
        patch.rejectedAt = null;
        patch.rejectReason = "";
      } else if (action === "reject") {
        patch.status = "rejected";
        patch.statusUpdatedAt = now;
        patch.rejectedAt = now;
        patch.approvedAt = null;
        patch.rejectReason = clean(body.reason || body.rejectReason || "");
      } else if (action === "pending") {
        patch.status = "pending";
        patch.statusUpdatedAt = now;
        patch.approvedAt = null;
        patch.rejectedAt = null;
        patch.rejectReason = clean(body.rejectReason || "");
      } else {
        return bad("Invalid action", 400);
      }

      // ถ้า requireAdmin() คืน admin info ได้ ก็ใส่ได้ เช่น admin.email
      if (admin?.email) patch.moderatedBy = clean(admin.email);
    } else if (status) {
      if (!["pending", "approved", "rejected"].includes(status))
        return bad("Invalid status", 400);

      patch.status = status;
      patch.statusUpdatedAt = now;

      if (status === "approved") {
        patch.approvedAt = now;
        patch.rejectedAt = null;
        patch.rejectReason = "";
      } else if (status === "rejected") {
        patch.rejectedAt = now;
        patch.approvedAt = null;
        patch.rejectReason = clean(body.rejectReason || "");
      } else {
        patch.approvedAt = null;
        patch.rejectedAt = null;
        patch.rejectReason = clean(body.rejectReason || "");
      }

      if (admin?.email) patch.moderatedBy = clean(admin.email);
    }

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
