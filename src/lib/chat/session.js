export function getOrCreateSessionId(storageKey = "reviewapp_chat_session_id") {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;

    const id =
      (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(storageKey, id);
    return id;
  } catch {
    // ถ้า browser ปิด storage
    return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
