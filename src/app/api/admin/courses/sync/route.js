import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import { requireAdmin } from "@/lib/adminAuth.server";
import { syncCoursesFromUpstream } from "@/lib/courseSync.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAdmin();
    await dbConnect();

    const stats = await syncCoursesFromUpstream();

    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error", ...(e?.payload || {}) },
      { status },
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const items = await Course.find({})
      .select("name isActive sortOrder createdAt")
      .sort({ isActive: -1, sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status },
    );
  }
}
