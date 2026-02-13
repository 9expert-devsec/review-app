import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    return NextResponse.json({ ok: true, admin });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
