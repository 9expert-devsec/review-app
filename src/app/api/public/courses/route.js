import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const items = await Course.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select({ name: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      items: items.map((x) => ({ id: String(x._id), name: x.name })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to load courses" },
      { status: 500 },
    );
  }
}
