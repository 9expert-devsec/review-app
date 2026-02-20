// src/components/ui/AvatarCropModal.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { cropToSquareFile } from "@/lib/cropImage.client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function AvatarCropModal({
  open,
  file,
  onClose,
  onConfirm, // (croppedFile) => void
  outputSize = 800,
}) {
  const [crop, setCrop] = useState({ x: 0, y: -10 }); // เอนขึ้นนิด ๆ ให้หน้าอยู่บน ๆ
  const [zoom, setZoom] = useState(1.1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const src = useMemo(() => {
    if (!open || !file) return "";
    return URL.createObjectURL(file);
  }, [open, file]);

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setBusy(false);
    setZoom(1.1);
    setCrop({ x: 0, y: -10 });
    setCroppedPixels(null);
  }, [open]);

  if (!open) return null;

  async function handleUse() {
    try {
      setBusy(true);
      setErr("");
      if (!file) throw new Error("No file");
      if (!croppedPixels) throw new Error("Crop not ready");

      const cropped = await cropToSquareFile(file, croppedPixels, outputSize);
      onConfirm?.(cropped);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Crop failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              ครอปรูปโปรไฟล์
            </div>
            <div className="text-xs text-slate-500">
              ลากรูปให้หน้าพอดีในกรอบวงกลม (จะบันทึกเป็นสี่เหลี่ยมจัตุรัส)
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ปิด
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="relative h-[360px] w-full overflow-hidden rounded-3xl bg-slate-900">
              {src ? (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
                />
              ) : null}
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600">Zoom</div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-2 w-full"
              />

              <div className="mt-4 text-xs text-slate-500">
                Tip: รูปแนวตั้งให้ดันขึ้นนิดนึง แล้วซูมให้ตา/หน้าอยู่กลางวงกลม
              </div>

              {err ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {err}
                </div>
              ) : null}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1.1);
                    setCrop({ x: 0, y: -10 });
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  รีเซ็ต
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleUse}
                  className={cx(
                    "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold text-white",
                    busy ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800",
                  )}
                >
                  {busy ? "กำลังครอป..." : "ใช้รูปนี้"}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-slate-400">
                ระบบจะเซฟเป็น JPG 1:1 (ประมาณ {outputSize}x{outputSize})
                เพื่อให้หน้าเว็บคมและไม่หนัก
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          คลิกพื้นหลังเพื่อปิด หรือกด “ปิด”
        </div>
      </div>
    </div>
  );
}
