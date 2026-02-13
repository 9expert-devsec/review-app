// src/app/api/admin/courses/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { requireAdmin } from "@/lib/adminAuth.server";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const items = await Course.find({})
      .sort({ name: 1 })
      .select({ name: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      items: items.map((c) => ({ ...c, id: String(c._id) })),
    });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Load courses failed" },
      { status },
    );
  }
}
