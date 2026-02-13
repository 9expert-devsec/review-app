// src/app/api/cron/sync-courses/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
// import Course from "@/models/Course"; // <- เปลี่ยนเป็น model ที่คุณใช้จริง
// import { syncCoursesFromSource } from "@/lib/syncCourses.server"; // <- แยก logic ไปไฟล์ lib ก็ได้

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = clean(searchParams.get("token"));
    const secret = clean(process.env.CRON_SECRET);

    if (!secret || token !== secret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();

    // ✅ TODO: ใส่ logic sync ของคุณตรงนี้
    // ตัวอย่างแนวคิด:
    // 1) fetch ต้นทาง
    // 2) upsert ลง Mongo ด้วย bulkWrite
    // 3) update lastSyncAt

    // await syncCoursesFromSource();

    return NextResponse.json({
      ok: true,
      synced: true,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || "Sync failed") },
      { status: 500 },
    );
  }
}
