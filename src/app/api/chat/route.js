// src/app/api/chat/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isEmptyObject(x) {
  return (
    x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Object.keys(x).length === 0
  );
}

function shouldInjectQuickReplies(data) {
  const resp = String(
    data?.response || data?.reply || data?.message || "",
  ).trim();
  const mt = String(data?.message_type || "").trim();

  // เงื่อนไข: backend กำลังถามให้เลือกหมวดหมู่
  return (
    mt === "text" && /เลือกหมวดหมู่|หมวดหมู่ที่สนใจ|สนใจเรียนด้านไหน/.test(resp)
  );
}

function buildFallbackQuickReplies() {
  // ✅ label = ที่โชว์บนชิป, value = ข้อความที่จะส่งกลับไปหา AI
  // จะใส่ (count) ก็ทำได้ แต่ตอนนี้เรายังไม่มี count จาก backend เลยใส่เฉยๆ
  return {
    "Microsoft Excel": "Microsoft Excel",
    "Power BI": "Power BI",
    "Microsoft SQL Server": "Microsoft SQL Server",
    "Power Automate": "Power Automate",
    "Power Apps": "Power Apps",
    Canva: "Canva",
    "Generative AI": "Generative AI",
    "Web Developer": "Web Developer",
    "Data Analyst": "Data Analyst",
  };
}

export async function POST(req) {
  const base =
    process.env.CHATBOT_V2_API_URL ||
    process.env.NEXT_PUBLIC_CHATBOT_V2_API_URL ||
    process.env.NUXT_PUBLIC_CHATBOT_V2_API_URL;

  if (!base) {
    return NextResponse.json(
      { ok: false, error: "Missing CHATBOT_V2_API_URL" },
      { status: 500 },
    );
  }

  const url = new URL("/api/chat", base);
  url.searchParams.set("backend", "langchain");

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  let upstream;
  try {
    upstream = await fetch(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Upstream fetch failed" },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  const data = safeJsonParse(text);

  console.log("[chat-proxy] upstream status:", upstream.status);
  console.log("[chat-proxy] upstream body:", text.slice(0, 2000));

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Upstream returned non-JSON", raw: text },
      { status: upstream.status },
    );
  }

  // ✅ inject quick replies เมื่อ upstream ส่ง {} ว่าง
  const qr = data.quick_replies ?? data.quickReplies ?? null;

  if ((qr == null || isEmptyObject(qr)) && shouldInjectQuickReplies(data)) {
    data.quick_replies = buildFallbackQuickReplies();
    console.log(
      "[chat-proxy] injected quick_replies:",
      Object.keys(data.quick_replies),
    );
  }

  return NextResponse.json(data, { status: upstream.status });
}
