import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();

  const total = await Course.countDocuments({});
  const active = await Course.countDocuments({ isActive: true });
  const sample = await Course.find({})
    .select("name isActive sortOrder syncedAt createdAt")
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json({ ok: true, total, active, sample });
}
