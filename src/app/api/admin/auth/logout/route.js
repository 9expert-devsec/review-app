import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = String(process.env.ADMIN_PATH_KEY || "").trim();

export async function POST() {
  const redirectTo = KEY ? `/${KEY}/login` : "/";

  const res = NextResponse.json({ ok: true, redirectTo });

  // ลบ cookie ต้องใช้ path เดียวกับตอน set (ตอนนี้ควรเป็น "/")
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
