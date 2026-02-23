// src/lib/chat/chatClient.js

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function unwrap(x) {
  // บาง backend ชอบห่อ response ไว้ใน data/result/payload
  return x?.data ?? x?.result ?? x?.payload ?? x;
}

function pickText(d) {
  // ✅ Backend ของคุณใช้ key = response
  return (
    d?.response ??
    d?.reply ??
    d?.message ??
    d?.text ??
    d?.answer ??
    d?.output ??
    d?.assistantText ??
    d?.assistant?.text ??
    d?.responseText ??
    d?.ui?.response ??
    d?.data?.response ??
    ""
  );
}

function normalizeQuickReplies(d) {
  const raw =
    d?.quickReplies ??
    d?.quick_replies ??
    d?.suggestions ??
    d?.chips ??
    d?.quickReplyChips ??
    d?.ui?.quickReplies ??
    [];

  // รองรับทั้ง ["a","b"] และ [{text:"a"}]
  return asArray(raw)
    .map((x) =>
      typeof x === "string" ? x : x?.text || x?.label || x?.value || "",
    )
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

function normalizeCourses(d) {
  const raw =
    d?.courses ??
    d?.courseRecommendations ??
    d?.recommendations?.courses ??
    d?.cards?.courses ??
    d?.ui?.courses ??
    [];

  return asArray(raw);
}

function normalizePromotions(d) {
  const raw =
    d?.promotions ??
    d?.promotionCards ??
    d?.recommendations?.promotions ??
    d?.cards?.promotions ??
    d?.ui?.promotions ??
    [];

  return asArray(raw);
}

/**
 * Send chat message to Next.js proxy route (/api/chat)
 * Payload:
 *  - sessionId: string
 *  - message: string
 *  - history: [{ role: "user"|"assistant", content: string }]
 */
export async function sendChat({ sessionId, message, history }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId,
      message,
      history: asArray(history),
    }),
    cache: "no-store",
  });

  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      raw?.error || raw?.message || `Chat request failed (${res.status})`;
    throw new Error(msg);
  }

  const d = unwrap(raw);

  const reply = String(pickText(d) || "").trim();
  const quickReplies = normalizeQuickReplies(d);
  const courses = normalizeCourses(d);
  const promotions = normalizePromotions(d);

  return { raw, reply, quickReplies, courses, promotions };
}
