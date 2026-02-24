// src/lib/chat/chatClient.js

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function unwrap(x) {
  return x?.data ?? x?.result ?? x?.payload ?? x;
}

function pickText(d) {
  return (
    d?.response ?? // ✅ backend ของคุณ
    d?.reply ??
    d?.message ??
    d?.text ??
    d?.answer ??
    d?.output ??
    d?.assistantText ??
    d?.assistant?.text ??
    ""
  );
}

function normalizeQuickReplies(d) {
  const raw =
    d?.quickReplies ??
    d?.quick_replies ?? // ✅ backend ของคุณ (บาง intent เป็น object)
    d?.quickReplyChips ??
    d?.chips ??
    d?.suggestions ??
    d?.suggested_questions ??
    d?.categories ??
    d?.ui?.quickReplies ??
    d?.ui?.chips ??
    [];

  // เคส 1: array
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (typeof x === "string") return x;
        return x?.text || x?.label || x?.value || x?.name || "";
      })
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }

  // เคส 2: object/map เช่น { "Microsoft Excel": 5, "Power BI": 3 }
  if (raw && typeof raw === "object") {
    return Object.entries(raw)
      .map(([k, v]) => {
        const label = String(k || "").trim();
        if (!label) return null;

        const count =
          typeof v === "number"
            ? v
            : typeof v === "string"
              ? Number(v)
              : (v?.count ?? v?.total ?? null);

        return {
          label, // QuickChatBar จะเติม (count) ให้เองได้ หรือคุณจะเติมเองก็ได้
          value: label,
          count: Number.isFinite(count) ? count : null,
        };
      })
      .filter(Boolean);
  }

  return [];
}

function normalizeCourses(d) {
  const raw =
    d?.courses ??
    d?.courseRecommendations ??
    d?.recommendations?.courses ??
    d?.cards?.courses ??
    d?.ui?.courses ??
    [];

  return Array.isArray(raw) ? raw : [];
}

function normalizePromotions(d) {
  const raw =
    d?.promotions ??
    d?.promotionCards ??
    d?.recommendations?.promotions ??
    d?.cards?.promotions ??
    d?.ui?.promotions ??
    [];

  return Array.isArray(raw) ? raw : [];
}

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

  return {
    raw,
    reply: String(pickText(d) || "").trim(),
    quickReplies: normalizeQuickReplies(d),
    courses: normalizeCourses(d),
    promotions: normalizePromotions(d),
  };
}
