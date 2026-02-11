import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signAdminToken } from "@/lib/adminJwt.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const HASH = String(process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = bcrypt.compareSync(password, HASH);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAdminToken({ role: "admin", email });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // maxAge: 60 * 60 * 24 * 7, // 7 วัน (ถ้าต้องการ)
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}