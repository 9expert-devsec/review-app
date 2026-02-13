import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { syncCoursesFromUpstream } from "@/lib/courseSync.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function isAuthorized(req) {
  const secret = clean(process.env.CRON_SECRET);
  if (!secret) return false;

  const { searchParams } = new URL(req.url);
  const token = clean(searchParams.get("token"));
  return token && token === secret;
}

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();
    const stats = await syncCoursesFromUpstream();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    const msg = String(e?.message || "Sync failed");
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: msg, ...(e?.payload ? { ...e.payload } : {}) },
      { status },
    );
  }
}
