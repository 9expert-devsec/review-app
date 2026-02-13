import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const items = await Course.find({ isActive: true })
      .select("name sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || "Load failed") },
      { status: 500 },
    );
  }
}
