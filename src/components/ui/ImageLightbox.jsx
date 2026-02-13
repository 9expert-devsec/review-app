"use client";

import { useEffect } from "react";

export default function ImageLightbox({ url, onClose, alt = "image" }) {
  useEffect(() => {
    if (!url) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.(); // คลิกพื้นหลังเพื่อปิด
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="absolute -right-3 -top-3 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
        >
          ✕
        </button>

        <div className="rounded-2xl bg-black/20 p-2">
          <img
            src={url}
            alt={alt}
            className="max-h-[85vh] w-full rounded-xl bg-white object-contain"
          />
        </div>

        <div className="mt-3 text-center text-xs text-white/80">
          คลิกพื้นหลังหรือกด ESC เพื่อปิด
        </div>
      </div>
    </div>
  );
}
