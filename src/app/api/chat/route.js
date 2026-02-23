import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // backend expects: {baseUrl}/api/chat?backend=langchain (ตามไกด์)
  const url = new URL("/api/chat", base);
  url.searchParams.set("backend", "langchain");

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const upstream = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await upstream.text();

  // ✅ เพิ่ม 2 บรรทัดนี้
  console.log("[chat-proxy] upstream status:", upstream.status);
  console.log("[chat-proxy] upstream body:", text.slice(0, 3000));

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, error: "Upstream returned non-JSON", raw: text };
  }

  return NextResponse.json(data, { status: upstream.status });
}
