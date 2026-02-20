"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  cloudinaryAvatarThumb,
  cloudinaryAvatarFull,
} from "@/lib/cloudinaryUrl.client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
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
    const thumb = cloudinaryAvatarThumb(url, 160); // จะใช้ 96 ก็ได้ แต่ 160 จะคมขึ้น (ยังแสดง 40px เหมือนเดิม)
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

function cloudThumb(url, size = 96) {
  const s = String(url || "");
  const marker = "/image/upload/";
  const i = s.indexOf(marker);
  if (i === -1) return s;

  // ใช้ g_auto เพื่อโฟกัสจุดสำคัญ (มักเป็นหน้า) แบบปลอดภัย
  // ถ้าคุณอยาก “เน้นหน้า” แบบชัดขึ้น ลองเปลี่ยน g_auto -> g_face ได้
  const t = `c_fill,g_auto,w_${size},h_${size},q_auto,f_auto`;
  return s.slice(0, i + marker.length) + t + "/" + s.slice(i + marker.length);
}

function TestimonialCard({ item }) {
  const metaParts = [item.courseName, item.reviewerCompany].filter(Boolean);
  const metaText = metaParts.join(" • ");

  return (
<<<<<<< Updated upstream
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
=======
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_6px_12px_rgba(15,23,42,0.06)] h-full flex flex-col">
>>>>>>> Stashed changes
      <StarsRow rating={item.rating} />

      {/* ทำส่วนข้อความให้เป็นตัวดันความสูง */}
      <div className="mt-4 text-sm leading-7 text-slate-800 flex-1">
        <div className="font-semibold text-slate-900 line-clamp-2">
          {item.headline || ""}
        </div>
        <div className="mt-2 whitespace-pre-line text-slate-700 line-clamp-5">
          {item.comment || ""}
        </div>
      </div>

      {/* แถบโปรไฟล์อยู่ล่างสุดเสมอ */}
      {/* แถบโปรไฟล์อยู่ล่างสุดเสมอ */}
      <div className="mt-6 flex items-center gap-4">
        <Avatar name={item.reviewerName} url={item.avatarUrl} />

        <div className="min-w-0 flex-1">
          {/* ชื่อ */}
          <div className="font-semibold text-[#0D1B2A] line-clamp-1">
            {item.reviewerName || "-"}
          </div>

          {/* role + company (บรรทัดเดียว) */}
{(() => {
  const role = String(item.reviewerRole || item.jobTitle || "").trim();
  const company = String(item.reviewerCompany || item.company || "").trim();
  const line = [role, company].filter(Boolean).join(" • ");
  if (!line) return null;

  return (
    <div className="mt-0.5 text-xs text-slate-500 line-clamp-1" title={line}>
      {line}
    </div>
  );
})()}

          {/* 3) หลักสูตร (ถ้ามี) */}
          {String(item.courseName || "").trim() ? (
            <div
              className="mt-0.5 text-sm text-slate-500 line-clamp-1"
              title={String(item.courseName || "").trim()}
            >
              {String(item.courseName || "").trim()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialCarouselClient({ items = [] }) {
  const [hovered, setHovered] = useState(false);
  const [perView, setPerView] = useState(3);

  // ✅ perView จริง = ไม่เกินจำนวน items (กันกรณี items น้อย)
  const realPerView = Math.max(1, Math.min(perView, items.length || 1));
  const canLoop = items.length > realPerView;

  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const transitionSpeed = 500; // ms

  // 1) สร้าง list สำหรับ infinite loop เฉพาะตอนที่ canLoop
  const extendedList = useMemo(() => {
    if (!items.length) return [];
    if (!canLoop) return items;

    const before = items.slice(-realPerView);
    const after = items.slice(0, realPerView);
    return [...before, ...items, ...after];
  }, [items, canLoop, realPerView]);

  // 2) ตั้ง index เริ่มต้น
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

  // 3) Responsive
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

  // 4) Infinite loop warp
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

  // 5) Autoplay
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
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-[0.98] transition"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" />
          </button>
        </>
      )}

      {/* Viewport */}
      <div className="overflow-hidden">
        <div
<<<<<<< Updated upstream
          className="flex"
=======
          className="flex items-stretch py-10"
>>>>>>> Stashed changes
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${shiftPct}%)`,
            transition:
              canLoop && isTransitioning
                ? `transform ${transitionSpeed}ms ease-out`
                : "none",
          }}
        >
          {extendedList.map((it, i) => (
            <div
              key={`${it.id || it._id}-${i}`}
              className="shrink-0 px-3 h-full"
              style={{ flexBasis: `${100 / realPerView}%` }}
            >
              <TestimonialCard item={it} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
