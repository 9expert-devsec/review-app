"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Building2,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  cloudinaryAvatarThumb,
  cloudinaryAvatarFull,
} from "@/lib/cloudinaryUrl.client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function clean(s) {
  return String(s ?? "").trim();
}

function clampRating(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function StarsRow({ rating }) {
  const r = clampRating(rating);
  return (
    <div className="flex gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cx("h-4 w-4", i < r ? "fill-current" : "")} />
      ))}
    </div>
  );
}

function Avatar({ name, url }) {
  const initial =
    String(name || "?")
      .trim()
      .slice(0, 1) || "?";

  if (url) {
    const thumb = cloudinaryAvatarThumb(url, 160);
    return (
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 bg-white">
        <img
          src={thumb}
          alt={name || "avatar"}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-600 to-blue-400">
      {initial}
    </div>
  );
}

function pickReviewText(item) {
  return String(item?.reviewText || item?.body || item?.comment || "")
    .trim()
    .replace(/\s+\n/g, "\n");
}

function InfoLine({ icon: Icon, text, title }) {
  const t = clean(text);
  if (!t) return null;
  return (
    <div
      className="flex items-center gap-2 text-xs text-slate-500"
      title={title || t}
    >
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0 truncate">{t}</div>
    </div>
  );
}

function TestimonialCard({ item, expanded, onToggle }) {
  const headline = clean(item?.headline || item?.title || "");
  const text = pickReviewText(item);
  const reviewerName = clean(item?.reviewerName || item?.name || "-");

  const role = clean(
    item?.reviewerRole || item?.jobTitle || item?.position || "",
  );
  const company = clean(
    item?.reviewerCompany || item?.company || item?.companyName || "",
  );
  const course = clean(item?.courseName || "");
  const title = course || headline || "";

  // ✅ ความสูงเท่ากันทุกใบ: fix min-height + layout แบบ flex
  // ✅ ขยาย/ย่อ: ตอน expanded จะให้กล่องข้อความ scroll ภายใน (การ์ดไม่สูงขึ้น)
  const showToggle = text.length > 160; // ปรับ threshold ได้
  const textBoxClass = expanded
    ? "max-h-[220px] overflow-y-auto pr-2"
    : "max-h-[128px] overflow-hidden";
// h417
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_6px_12px_rgba(15,23,42,0.06)] h-full w-[340px] min-h-[400px] flex flex-col"> 
      <StarsRow rating={item.rating} />

      {/* ส่วนข้อความ = โซนหลัก */}
      <div className="mt-4 flex-1 min-h-0">
<div className="font-semibold text-slate-900 line-clamp-2">
  {title}
</div>

        <div
          className={cx(
            "mt-2 whitespace-pre-line text-sm leading-7 text-slate-700",
            textBoxClass,
          )}
        >
          {expanded ? (
            <div>{text}</div>
          ) : (
            <div className="line-clamp-5">{text}</div>
          )}
        </div>

        {showToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            {expanded ? (
              <>
                ย่อข้อความ <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                ดูเพิ่มเติม <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        ) : null}
      </div>

      {/* แถบโปรไฟล์อยู่ล่างสุดเสมอ */}
      <div className="mt-6 flex items-center gap-4 min-h-20">
        <Avatar name={reviewerName} url={item.avatarUrl} />

        <div className="min-w-0 flex-1">
          {/* 1) ชื่อ */}
          <div className="font-semibold text-[#0D1B2A] line-clamp-1">
            {reviewerName}
          </div>

          {/* 2) ตำแหน่ง (มี icon) */}
          <InfoLine icon={Briefcase} text={role} />

          {/* 3) บริษัท (มี icon) */}
          <InfoLine icon={Building2} text={company} />

          {/* 4) หลักสูตร (มี icon) */}
          {/* <InfoLine icon={GraduationCap} text={course} /> */}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialCarouselClient({ items = [] }) {
  const [hovered, setHovered] = useState(false);
  const [perView, setPerView] = useState(3);

  const realPerView = Math.max(1, Math.min(perView, items.length || 1));
  const canLoop = items.length > realPerView;

  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const transitionSpeed = 500; // ms

  // ✅ state สำหรับ “ยืด/หด” แบบคงอยู่ระหว่างเลื่อน
  // ใช้ reviewer id ถ้ามี ไม่งั้น fallback ด้วย _id/id
  const [expandedKey, setExpandedKey] = useState("");

  const extendedList = useMemo(() => {
    if (!items.length) return [];
    if (!canLoop) return items;

    const before = items.slice(-realPerView);
    const after = items.slice(0, realPerView);
    return [...before, ...items, ...after];
  }, [items, canLoop, realPerView]);

  useEffect(() => {
    if (!items.length) return;
    if (!canLoop) {
      setIsTransitioning(false);
      setIndex(0);
      return;
    }
    setIsTransitioning(true);
    setIndex(realPerView);
  }, [items.length, canLoop, realPerView]);

  // Responsive
  useEffect(() => {
    function calc() {
      const w = window.innerWidth;
      if (w < 640) return 1;
      if (w < 1024) return 2;
      return 3;
    }
    const onResize = () => {
      setIsTransitioning(false);
      setPerView(calc());
    };
    setPerView(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Infinite loop warp
  const handleTransitionEnd = () => {
    if (!canLoop) return;

    if (index >= extendedList.length - realPerView) {
      setIsTransitioning(false);
      setIndex(realPerView);
    } else if (index <= 0) {
      setIsTransitioning(false);
      setIndex(extendedList.length - realPerView * 2);
    }
  };

  // เปิด transition กลับมาหลัง warp
  useEffect(() => {
    if (!canLoop) return;
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => setIsTransitioning(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning, canLoop]);

  // Autoplay
  useEffect(() => {
    if (!canLoop) return;
    if (hovered) return;
    const t = setInterval(() => {
      next();
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, index, canLoop]);

  function prev() {
    if (!canLoop) return;
    if (!isTransitioning) return;
    setIndex((i) => i - 1);
  }

  function next() {
    if (!canLoop) return;
    if (!isTransitioning) return;
    setIndex((i) => i + 1);
  }

  if (!items.length) {
    return (
      <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        ยังไม่มีรีวิวที่เปิด Active
      </div>
    );
  }

  const shiftPct = (100 / realPerView) * index;

  return (
    <div
      className="mt-12 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Arrows */}
      {canLoop && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-[0.98] transition"
            aria-label="ก่อนหน้า"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-[0.98] transition"
            aria-label="ถัดไป"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" />
          </button>
        </>
      )}

      {/* Viewport */}
      <div className="overflow-hidden">
        <div
          className="flex items-stretch py-10"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${shiftPct}%)`,
            transition:
              canLoop && isTransitioning
                ? `transform ${transitionSpeed}ms ease-out`
                : "none",
          }}
        >
          {extendedList.map((it, i) => {
            const baseId = String(
              it?.id || it?._id || it?.sourceId || it?.reviewerId || "",
            );
            const key = baseId || `${i}`;
            const isExpanded = expandedKey === key;

            return (
              <div
                key={`${it.id || it._id}-${i}`}
                className="shrink-0 px-3 h-full"
                style={{ flexBasis: `${100 / realPerView}%` }}
              >
                <TestimonialCard
                  item={it}
                  expanded={isExpanded}
                  onToggle={() => setExpandedKey(isExpanded ? "" : key)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
