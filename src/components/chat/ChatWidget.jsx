// src/components/chat/ChatWidget.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/components/chat/useChatStore";

import {
  X,
  Maximize2,
  Minimize2,
  Send as SendIcon,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  Clock3,
  User as UserIcon,
  Banknote,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPrice(s) {
  const t = cleanText(s);
  return t ? t : "สอบถามราคา";
}

function durationText(days, hours) {
  const d = Number(days || 0);
  const h = Number(hours || 0);
  if (!d && !h) return "";
  return `${d ? `${d} วัน` : ""}${d && h ? " " : ""}${h ? `${h} ชม.` : ""}`.trim();
}

function formatTimeHM(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* ---------------- UI bits ---------------- */

function TypingBubble() {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 size-8 shrink-0 rounded-full bg-[var(--chat-bot-avatar-bg,#E8EEF7)] ring-1 ring-black/5" />
      <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="inline-block size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
          <span className="inline-block size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
          <span className="inline-block size-2 animate-bounce rounded-full bg-slate-400" />
          <span className="ml-2 text-xs text-slate-500">กำลังพิมพ์…</span>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPick }) {
  return (
    <div className="grid h-full place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-[var(--chat-bot-avatar-bg,#E8EEF7)] ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/9expert-mascot-logo.png"
            alt="9Expert"
            className="h-14 w-14 object-contain"
          />
        </div>

        <div className="mt-4 text-2xl font-extrabold text-slate-900">
          สวัสดีครับ!
        </div>
        <div className="mt-2 text-sm text-slate-600">
          ผมคือ AI Assistant พร้อมช่วยตอบคำถามเกี่ยวกับ
        </div>

        <div className="mt-6 space-y-3 text-left">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-lg">🧩</span>
            <div className="text-sm font-semibold text-slate-800">
              เส้นทางอาชีพด้าน IT
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-lg">🎓</span>
            <div className="text-sm font-semibold text-slate-800">
              คอร์สเรียนที่เหมาะสม
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-lg">💡</span>
            <div className="text-sm font-semibold text-slate-800">
              ทักษะที่ต้องพัฒนา
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "แนะนำคอร์ส Excel",
            "มีโปรโมชันอะไรบ้าง",
            "อยากเริ่มสาย Data ต้องเรียนอะไร",
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-6 text-xs text-slate-500">
          พิมพ์คำถามของคุณด้านล่างได้เลย!
        </div>
      </div>
    </div>
  );
}

/* ---------------- Quick Chat Bar ---------------- */

function normalizeQuickItem(x) {
  if (!x) return null;
  if (typeof x === "string") {
    const label = cleanText(x);
    return label ? { label, value: label } : null;
  }
  // รองรับ object เช่น {label, text, value, count}
  const label = cleanText(x.label || x.text || x.value || "");
  if (!label) return null;
  const count = x.count != null ? Number(x.count) : null;
  return {
    label:
      count != null && !Number.isNaN(count) ? `${label} (${count})` : label,
    value: x.value || x.text || x.label || label,
  };
}

function QuickChatBar({ items, onPick }) {
  const scRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const list = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return arr.map(normalizeQuickItem).filter(Boolean);
  }, [items]);

  const updateProgress = () => {
    const el = scRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) {
      setProgress(0);
      return;
    }
    setProgress(el.scrollLeft / max);
  };

  useEffect(() => {
    updateProgress();
    const el = scRef.current;
    if (!el) return;
    const onScroll = () => updateProgress();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const scrollBy = (dir) => {
    const el = scRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (list.length === 0) return null;

  return (
    <div className="relative">
      {/* arrows */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-[-6px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="เลื่อนซ้าย"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-[-6px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="เลื่อนขวา"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>

      {/* pills */}
      <div
        ref={scRef}
        className="flex gap-2 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((it, idx) => (
          <button
            key={`${it.label}_${idx}`}
            type="button"
            onClick={() => onPick(it.value)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title={it.label}
          >
            {it.label}
          </button>
        ))}
      </div>

      {/* progress bar */}
      <div className="h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full"
          style={{
            width: `${Math.max(8, progress * 100)}%`,
            background:
              "linear-gradient(135deg, var(--chat-primary,#5B8CFF) 0%, var(--chat-primary-dark,#7C3AED) 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- Cards ---------------- */

function CourseCard({ item }) {
  if (!item) return null;

  const id = cleanText(item.course_id || item.courseId || "");
  const title = cleanText(item.title || item.name || "");
  const desc = cleanText(item.description || "");
  const instructor = cleanText(item.instructor || "");
  const diff = cleanText(item.difficulty_text || item.difficulty || "");
  const img = cleanText(item.image_url || item.imageUrl || "");
  const url = cleanText(item.course_url || item.url || item.link || "");
  const price = cleanPrice(item.price);
  const dur = durationText(item.training_days, item.training_hours);

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* cover */}
      <div className="relative bg-slate-100">
        <div className="aspect-[16/9] w-full">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {id ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/5">
              {id}
            </span>
          ) : null}
          {diff ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/5">
              {diff}
            </span>
          ) : null}
        </div>
      </div>

      {/* content */}
      <div className="p-4">
        <div className="text-[15px] font-semibold text-slate-900">{title}</div>

        {desc ? (
          <div className="mt-1 line-clamp-2 text-sm text-slate-600">{desc}</div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {dur ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {dur}
            </span>
          ) : null}

          {instructor ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <UserIcon className="h-3.5 w-3.5" />
              {instructor}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
            <Banknote className="h-3.5 w-3.5" />
            {price}
          </span>
        </div>

        <div className="mt-4">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--chat-link,#2563eb)] hover:underline"
            >
              คลิกเพื่อดูรายละเอียด
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              กรุณาติดต่อสอบถาม
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function sortPromotions(items) {
  const arr = Array.isArray(items) ? items : [];
  // stable sort: decorate
  const decorated = arr.map((p, idx) => ({ p, idx }));
  const asNum = (v, fallback = 999999) => {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };
  const asTime = (v) => {
    const t = new Date(v || 0).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const isFeatured = (p) =>
    !!(p?.isFeatured || p?.featured || p?.pinned || p?.isPinned);

  decorated.sort((a, b) => {
    const pa = a.p;
    const pb = b.p;

    // 1) featured/pinned first
    const fa = isFeatured(pa) ? 0 : 1;
    const fb = isFeatured(pb) ? 0 : 1;
    if (fa !== fb) return fa - fb;

    // 2) displayOrder / priority / rank
    const oa = asNum(pa.displayOrder ?? pa.order ?? pa.priority ?? pa.rank);
    const ob = asNum(pb.displayOrder ?? pb.order ?? pb.priority ?? pb.rank);
    if (oa !== ob) return oa - ob;

    // 3) latest first (publishedAt/updatedAt/createdAt)
    const ta = Math.max(
      asTime(pa.publishedAt),
      asTime(pa.updatedAt),
      asTime(pa.createdAt),
    );
    const tb = Math.max(
      asTime(pb.publishedAt),
      asTime(pb.updatedAt),
      asTime(pb.createdAt),
    );
    if (ta !== tb) return tb - ta;

    return a.idx - b.idx;
  });

  return decorated.map((x) => x.p);
}

function PromotionCard({ item }) {
  if (!item) return null;

  const title = cleanText(item.title || item.name || "Promotion");
  const desc = cleanText(item.description || item.desc || "");
  const badge = cleanText(item.badge || item.tag || "");
  const img = cleanText(item.image_url || item.imageUrl || item.cover || "");
  const url = cleanText(item.url || item.link || "");

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {img ? (
        <div className="relative bg-slate-100">
          <div className="aspect-[16/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          {badge ? (
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/5">
              {badge}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p-4">
        <div className="text-[15px] font-semibold text-slate-900">{title}</div>
        {desc ? (
          <div className="mt-1 line-clamp-3 text-sm text-slate-600">{desc}</div>
        ) : null}

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--chat-link,#2563eb)] hover:underline"
          >
            ดูรายละเอียด
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CourseCarousel({ items }) {
  const ref = useRef(null);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="relative pt-2">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-[-10px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="ก่อนหน้า"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-[-10px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="ถัดไป"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((c, i) => (
          <div
            key={c.course_id || c.id || c._id || i}
            className="w-[85vw] max-w-[360px] shrink-0 snap-start sm:w-[320px] md:w-[340px]"
          >
            <CourseCard item={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PromotionCarousel({ items }) {
  const ref = useRef(null);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="relative pt-2">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-[-10px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="ก่อนหน้า"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-[-10px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 hover:bg-white md:inline-flex"
        aria-label="ถัดไป"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => (
          <div
            key={p.id || p._id || i}
            className="w-[88vw] max-w-[420px] shrink-0 snap-start sm:w-[360px] md:w-[420px]"
          >
            <PromotionCard item={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

async function postFeedback(payload) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false)
    throw new Error(data?.error || "feedback failed");
  return data;
}

/* ---------------- Main ---------------- */

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { init, send, reset, messages, isLoading, error, lastAssistant } =
    useChatStore();

  const [input, setInput] = useState("");
  const listRef = useRef(null);

  // messageId -> "up" | "down"
  const [rated, setRated] = useState({});

  useEffect(() => {
    init();
  }, [init]);

  // auto scroll to bottom
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages, isLoading, isFullscreen]);

  // body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC behavior:
  // - If fullscreen: exit fullscreen
  // - else close overlay
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (isFullscreen) setIsFullscreen(false);
      else setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isFullscreen]);

  const quickReplies = useMemo(() => {
    const qr = lastAssistant?.quickReplies;
    return Array.isArray(qr) ? qr : [];
  }, [lastAssistant]);

  const onSend = async (text) => {
    const t = String(text || "").trim();
    if (!t || isLoading) return;
    setInput("");
    await send(t);
  };

  // ✅ fullscreen center / normal bottom-right
const windowClass = isFullscreen
  ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:w-[92vw] sm:h-[92vh] sm:max-w-[1200px] sm:max-h-[900px]  h-screen w-screen"
  : "left-0 right-0 bottom-0 top-0 w-auto h-auto sm:left-auto sm:right-5 sm:bottom-20 sm:top-auto sm:w-[70vw] sm:max-w-[720px] sm:h-[85vh] sm:max-h-[85vh]";

  const headerStyle = {
    background:
      "linear-gradient(135deg, var(--chat-primary,#5B8CFF) 0%, var(--chat-primary-dark,#7C3AED) 100%)",
  };

  const floatingStyle = {
    background:
      "linear-gradient(135deg, var(--chat-primary,#5B8CFF) 0%, var(--chat-primary-dark,#7C3AED) 100%)",
  };

  const onRate = async (msgId, value) => {
    if (!msgId) return;
    if (rated[msgId]) return;

    setRated((prev) => ({ ...prev, [msgId]: value }));

    // หา user message ก่อนหน้า assistant message เพื่อส่ง context
    const idx = messages.findIndex((m) => m.id === msgId);
    let lastUserText = "";
    if (idx > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i]?.role === "user") {
          lastUserText = messages[i]?.text || "";
          break;
        }
      }
    }

    const assistantText = messages[idx]?.text || "";

    try {
      await postFeedback({
        rating: value, // "up" | "down"
        messageId: msgId,
        userText: lastUserText,
        assistantText,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        createdAt: Date.now(),
      });
    } catch {
      // ไม่ block UX
    }
  };

  return (
    <>
      {/* Floating Button */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer fixed bottom-5 right-5 z-800 sm:z-999 flex items-center justify-center rounded-full p-3 
             shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/20 
             transition-all duration-500 ease-[box-bezier(0.23,1,0.32,1)]
             hover:shadow-[0_0_30px_rgba(var(--primary-color),0.5)] 
             hover:-translate-y-2 hover:brightness-125
             active:scale-90 active:duration-150"
        style={floatingStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/9expert-mascot-logo.png"
          alt="Logo"
          className="h-6 w-6 object-contain"
        />
        <span className="ml-2 text-sm font-semibold text-white">Chat AI</span>
      </button>


      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-999 sm:z-800">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            className={cx(
              "absolute flex flex-col overflow-hidden sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5",
              "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              windowClass,
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 text-white"
              style={headerStyle}
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/9expert-mascot-logo.png"
                  alt="9Expert Logo"
                  className="h-10 w-10 rounded-full bg-white/90 p-1 object-contain ring-1 ring-white/20"
                />
                <div>
                  <div className="text-sm font-semibold">
                    9Expert AI Assistant
                  </div>
                  <div className="text-xs text-white/80">
                    ถามเรื่องคอร์ส/โปรโมชันได้เลย
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
                >
                  ล้างแชต
                </button>

                {/* Fullscreen desktop only */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="cursor-pointer hidden rounded-lg bg-white/15 p-2 text-white/90 ring-1 ring-white/20 hover:bg-white/20 md:inline-flex"
                  aria-label="Fullscreen"
                  title="Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreen(false);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-lg bg-white/15 p-2 text-white/90 ring-1 ring-white/20 hover:bg-white/20"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Messages */}
              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto bg-slate-50/40 px-4 py-4"
              >
                {messages.length === 0 ? (
                  <WelcomeScreen onPick={onSend} />
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => {
                      const time = formatTimeHM(m.createdAt);
                      const isUser = m.role === "user";

                      if (isUser) {
                        return (
                          <div key={m.id} className="flex justify-end">
                            <div
                              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 text-white shadow-sm"
                              style={floatingStyle}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-white/80">
                                <span className="font-semibold">คุณ</span>
                                <span>{time}</span>
                              </div>
                              <div>{m.text}</div>
                            </div>
                          </div>
                        );
                      }

                      const courses = Array.isArray(m.courses) ? m.courses : [];
                      const promotionsRaw = Array.isArray(m.promotions)
                        ? m.promotions
                        : [];
                      const promotions = sortPromotions(promotionsRaw);

                      return (
                        <div key={m.id} className="flex items-start gap-2">
                          <div className="mt-1 grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--chat-bot-avatar-bg,#E8EEF7)] ring-1 ring-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/9expert-mascot-logo.png"
                              alt="AI"
                              className="h-5 w-5 object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">
                                  AI
                                </span>
                                <span>{time}</span>
                              </div>

                              {m.text ? (
                                <div className="text-sm leading-6 text-slate-800">
                                  {m.text}
                                </div>
                              ) : null}

                              {/* Promotions (carousel) */}
                              {promotions.length > 0 ? (
                                <div className="mt-3">
                                  <div className="text-xs font-semibold text-slate-500">
                                    โปรโมชัน
                                  </div>
                                  <PromotionCarousel items={promotions} />
                                </div>
                              ) : null}

                              {/* Courses (carousel) */}
                              {courses.length > 0 ? (
                                <div className="mt-3">
                                  <div className="text-xs font-semibold text-slate-500">
                                    คอร์สแนะนำ
                                  </div>
                                  <CourseCarousel items={courses} />
                                </div>
                              ) : null}

                              {/* Thumbs */}
                              <div className="mt-4 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onRate(m.id, "up")}
                                  disabled={!!rated[m.id]}
                                  className={cx(
                                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                                    rated[m.id] === "up"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    rated[m.id] ? "opacity-90" : "",
                                  )}
                                  title="มีประโยชน์"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  ดี
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onRate(m.id, "down")}
                                  disabled={!!rated[m.id]}
                                  className={cx(
                                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                                    rated[m.id] === "down"
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    rated[m.id] ? "opacity-90" : "",
                                  )}
                                  title="ต้องปรับปรุง"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  ปรับปรุง
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing */}
                    {isLoading ? <TypingBubble /> : null}

                    {/* Error */}
                    {error ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Quick Chat bar (เหมือนในรูป) */}
              {quickReplies.length > 0 && !isLoading && (
                <div className="border-t border-slate-200 bg-white px-3 py-2">
                  <QuickChatBar items={quickReplies} onPick={onSend} />
                </div>
              )}

              {/* Input */}
              <div className="border-t border-slate-200 bg-white p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSend(input);
                  }}
                  className="flex gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend(input);
                      }
                    }}
                    placeholder="พิมพ์คำถามของคุณ…"
                    rows={1}
                    className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-[10px] text-sm outline-none focus:border-[var(--chat-primary,#5B8CFF)]"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="cursor-pointer inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                    style={floatingStyle}
                  >
                    <SendIcon className="h-4 w-4" />
<span className="hidden sm:inline">ส่ง</span>
                  </button>
                </form>

                <div className="mt-2 text-center text-[11px] text-slate-500">
                  กด{" "}
                  <span className="rounded bg-slate-50 px-1 py-0.5 ring-1 ring-slate-200">
                    Enter
                  </span>{" "}
                  เพื่อส่ง หรือ{" "}
                  <span className="rounded bg-slate-50 px-1 py-0.5 ring-1 ring-slate-200">
                    Shift + Enter
                  </span>{" "}
                  เพื่อขึ้นบรรทัดใหม่
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
