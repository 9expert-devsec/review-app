"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

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
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-600 to-blue-400">
      {initial}
    </div>
  );
}

function TestimonialCard({ item }) {
  const metaParts = [item.courseName, item.reviewerCompany].filter(Boolean);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_6px_12px_rgba(15,23,42,0.06)]">
      <StarsRow rating={item.rating} />
      <div className="mt-4 text-sm leading-7 text-slate-800">
        <div className="font-semibold text-slate-900 line-clamp-2">
          {item.headline || ""}
        </div>
        <div className="mt-2 whitespace-pre-line text-slate-700 line-clamp-5">
          {item.comment || ""}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Avatar name={item.reviewerName} url={item.avatarUrl} />
        <div className="min-w-0">
          <div className="font-semibold text-[#0D1B2A] line-clamp-1">
            {item.reviewerName || "-"}
          </div>
          <div className="text-sm text-slate-500 line-clamp-1">
            {metaParts.join(" • ")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialCarouselClient({ items = [] }) {
  const [hovered, setHovered] = useState(false);
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0); // เราจะเริ่มที่ index 0 ของรายการที่ clone มา
  const [isTransitioning, setIsTransitioning] = useState(true);
  const transitionSpeed = 500; // ms

  // 1. สร้าง List ใหม่ที่มีการ Clone หัว-ท้ายเพื่อทำ Infinite Loop
  const extendedList = useMemo(() => {
    if (items.length === 0) return [];
    // เอาตัวท้ายมาต่อหน้า และเอาตัวหน้ามาต่อท้าย
    // [Last 3] + [Original List] + [First 3]
    const before = items.slice(-perView);
    const after = items.slice(0, perView);
    return [...before, ...items, ...after];
  }, [items, perView]);

  // ตั้งค่า index เริ่มต้นให้อยู่ที่ "ตัวแรกของข้อมูลจริง" (ไม่ใช่ตัวที่ clone มาไว้ข้างหน้า)
  useEffect(() => {
    setIndex(perView);
  }, [perView]);

  useEffect(() => {
    if (!isTransitioning) {
      // ต้องรอให้ State index เปลี่ยนเสร็จก่อน (ตำแหน่งวาร์ป)
      // แล้วค่อยเปิด Transition กลับมาสำหรับการเลื่อนครั้งถัดไป
      const timeout = setTimeout(() => {
        setIsTransitioning(true);
      }, 20); // ดีเลย์นิดเดียวพอให้ Browser render ทัน
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  // 2. Responsive Check
  useEffect(() => {
    function calc() {
      const w = window.innerWidth;
      if (w < 640) return 1;
      if (w < 1024) return 2;
      return 3;
    }
    const onResize = () => {
      setIsTransitioning(false); // ปิด animation ตอน resize เพื่อความเป๊ะ
      setPerView(calc());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 3. หัวใจของ Infinite Loop: การ "วาร์ป" กลับตำแหน่งจริงแบบไร้รอยต่อ
  const handleTransitionEnd = () => {
    // ถ้าเลื่อนไปจนถึงกลุ่ม Clone ด้านหลัง (หน้าสุดท้าย)
    if (index >= extendedList.length - perView) {
      setIsTransitioning(false); // ปิด animation
      setIndex(perView); // วาร์ปกลับไปตัวแรกของจริง
    }
    // ถ้าเลื่อนถอยหลังจนถึงกลุ่ม Clone ด้านหน้า
    else if (index <= 0) {
      setIsTransitioning(false);
      setIndex(extendedList.length - perView * 2);
    }
  };

  // เปิด Animation กลับมาหลังจากวาร์ปเสร็จ
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // 4. Autoplay
  useEffect(() => {
    if (hovered || items.length <= perView) return;
    const t = setInterval(() => {
      next();
    }, 3000);
    return () => clearInterval(t);
  }, [hovered, index, items.length, perView]);

  function prev() {
    if (!isTransitioning) return;
    setIndex((i) => i - 1);
  }

  function next() {
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

  // คำนวณ % การเลื่อน
  const shiftPct = (100 / perView) * index;

  return (
    <div
      className="mt-12 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Arrows */}
      {items.length > perView && (
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
          className="flex py-10"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${shiftPct}%)`,
            transition: isTransitioning
              ? `transform ${transitionSpeed}ms ease-out`
              : "none",
          }}
        >
          {extendedList.map((it, i) => (
            <div
              key={`${it.id || it._id}-${i}`} // ใช้ index ร่วมด้วยกัน key ซ้ำจากการ clone
              className="shrink-0 px-3"
              style={{ flexBasis: `${100 / perView}%` }}
            >
              <TestimonialCard item={it} />
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      {/* {items.length > perView && (
        <div className="mt-4 text-center text-xs text-slate-400">
          {hovered ? "หยุดอัตโนมัติ (hover)" : "เลื่อนอัตโนมัติทุก 5 วินาที"} •
          วนลูปต่อเนื่อง
        </div>
      )} */}
    </div>
  );
}
