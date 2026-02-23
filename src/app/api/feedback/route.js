// src/app/api/feedback/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function buildUpstreamUrl(base) {
  // รองรับทั้ง:
  // - base เป็น host เช่น https://vertex-search-api-xxx.run.app  -> append /api/feedback
  // - base เป็น full endpoint เช่น https://.../api/feedback      -> use as is
  const b = String(base || "").trim();
  if (!b) return "";
  if (b.includes("/api/feedback") || b.endsWith("/feedback")) return b;
  return b.replace(/\/$/, "") + "/api/feedback";
}

export async function POST(req) {
  const payload = await req.json().catch(() => null);
  if (!payload) return jsonError("Invalid JSON", 400);

  // ✅ อย่างน้อย log ไว้ก่อน (คุณจะเอาไปเก็บ DB ทีหลังได้ง่าย)
  console.log("[feedback] payload:", JSON.stringify(payload).slice(0, 2000));

  const base =
    process.env.FEEDBACK_API_URL ||
    process.env.NEXT_PUBLIC_FEEDBACK_API_URL ||
    process.env.NUXT_PUBLIC_FEEDBACK_API_URL;

  const upstreamUrl = buildUpstreamUrl(base);

  // ถ้าไม่ได้ตั้ง FEEDBACK_API_URL ก็ถือว่า ok (เพื่อไม่บล็อก UX)
  if (!upstreamUrl) {
    return NextResponse.json({ ok: true, forwarded: false });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: upstream.ok, raw: text };
    }

    // ถ้า upstream ล้ม ก็ยังให้ ok เพื่อ UX แต่บอกว่า forwarded ไม่สำเร็จ
    if (!upstream.ok) {
      console.warn("[feedback] upstream failed:", upstream.status, data);
      return NextResponse.json({
        ok: true,
        forwarded: false,
        upstreamStatus: upstream.status,
      });
    }

    return NextResponse.json({ ok: true, forwarded: true, upstream: data });
  } catch (e) {
    console.warn("[feedback] upstream error:", e?.message || e);
    return NextResponse.json({ ok: true, forwarded: false });
  }
}
