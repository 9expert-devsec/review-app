// src/app/api/admin/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signAdminToken } from "@/lib/adminAuth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body.email);
    const password = clean(body.password);

    const envEmail = clean(process.env.ADMIN_EMAIL);
    const envHash = clean(process.env.ADMIN_PASSWORD_HASH);

    if (!envEmail || !envHash) {
      return NextResponse.json(
        { ok: false, error: "Missing ADMIN_EMAIL / ADMIN_PASSWORD_HASH" },
        { status: 500 },
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing email/password" },
        { status: 400 },
      );
    }

    if (email.toLowerCase() !== envEmail.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(password, envHash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ✅ สำคัญ: await
    const token = await signAdminToken({ email: envEmail }, "8h");

    const res = NextResponse.json({ ok: true });

    // ✅ สำคัญ: secure + path
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
