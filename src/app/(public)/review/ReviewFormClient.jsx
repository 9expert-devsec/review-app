"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Image as ImageIcon, X } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function Star({ filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "text-4xl transition",
        filled ? "text-amber-400" : "text-slate-300 hover:text-slate-400",
      )}
      aria-label="star"
    >
      ★
    </button>
  );
}

const labelCls = "text-sm font-semibold text-slate-900";
const reqCls = "text-red-500";
const inputCls =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 " +
  "placeholder:text-slate-400 outline-none " +
  "focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 " +
  "disabled:bg-slate-50 disabled:text-slate-400";
const hintCls = "mt-2 text-xs text-slate-500";

function SectionTitle({ children }) {
  return (
    <div className="border-b border-slate-200 pb-3 text-base font-bold text-slate-900">
      {children}
    </div>
  );
}

function SectionTitle2({ children }) {
  return (
    <div className="mt-5 border-b border-slate-200 pb-3 text-base font-bold text-slate-900">
      {children}
    </div>
  );
}

/* ---------------- Terms content ---------------- */
const TERMS_TITLE = "ข้อตกลงและเงื่อนไขการให้ความยินยอมเผยแพร่คำนิยม";
const TERMS_BODY = `
ข้าพเจ้า (ซึ่งต่อไปนี้จะเรียกว่า "ผู้ให้ความยินยอม") ยินยอมให้ บริษัท นายน์เอ็กซ์เพิร์ท จำกัด (ซึ่งต่อไปนี้จะเรียกว่า "บริษัท")
มีสิทธิในการใช้ จัดเก็บ เผยแพร่ ทำซ้ำ และดัดแปลงคำคัดย่อของข้าพเจ้า ซึ่งรวมถึงแต่ไม่จำกัดเพียง ชื่อ-นามสกุล, รูปภาพ, ชื่อบริษัท,
และตำแหน่งงาน (เรียกรวมกันว่า "คำนิยม") เพื่อวัตถุประสงค์ทางการตลาด, การประชาสัมพันธ์, และการส่งเสริมภาพลักษณ์ของบริษัท

บริษัทอาจเผยแพร่คำนิยมดังกล่าวผ่านช่องทางต่างๆ ของบริษัท เช่น เว็บไซต์, โซเชียลมีเดีย, สื่อสิ่งพิมพ์, วิดีโอ
และสื่อส่งเสริมการขายอื่นๆ ทั่วโลก โดยไม่มีข้อจำกัดด้านเวลาและสถานที่

ผู้ให้ความยินยอมรับรองว่าคำนิยมและข้อมูลที่ให้เป็นความจริง และไม่ละเมิดสิทธิของบุคคลอื่น
ผู้ให้ความยินยอมมีสิทธิขอถอนความยินยอมในอนาคตได้ โดยแจ้งเป็นลายลักษณ์อักษรต่อบริษัท
ทั้งนี้ การถอนความยินยอมจะไม่มีผลย้อนหลังต่อการเผยแพร่/การใช้งานที่เกิดขึ้นแล้วก่อนวันที่บริษัทได้รับคำขอถอน
`.trim();

function TermsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (!open) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.30)]">
        <div className="px-8 pt-7">
          <div className="text-lg font-extrabold text-slate-900">
            {TERMS_TITLE}
          </div>
          <div className="mt-4 h-px bg-slate-200" />
        </div>

        <div className="px-8 py-6">
          <div className="max-h-[60vh] overflow-auto pr-2 text-sm leading-7 text-slate-700">
            {TERMS_BODY.split("\n").map((line, i) => (
              <p key={i} className={cx(i === 0 ? "" : "mt-3")}>
                {line}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-[0.99] transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Image compress (client) ---------------- */
async function compressImageFile(
  file,
  {
    maxSize = 1024,
    quality = 0.82,
    mimeType = "image/webp", // "image/jpeg" ก็ได้
  } = {},
) {
  if (!file || !file.type?.startsWith("image/")) return file;

  const srcUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = srcUrl;
    });

    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (!w || !h) return file;

    const scale = Math.min(1, maxSize / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, tw, th);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality),
    );
    if (!blob) return file;

    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/jpeg"
          ? "jpg"
          : "webp";

    const name = (file.name || "avatar").replace(/\.[a-z0-9]+$/i, "");
    return new File([blob], `${name}.${ext}`, { type: mimeType });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

export default function WriteReviewClient() {
  const router = useRouter();

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [consent, setConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // avatar upload UI
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/public/courses", { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j?.ok) {
          throw new Error(j?.error || "Load courses failed");
        }
        setCourses(j.items || []);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || "Load courses failed"));
      } finally {
        if (!alive) return;
        setLoadingCourses(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function resetFileInput() {
    if (fileRef.current) fileRef.current.value = "";
  }

  async function pickImage(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setErr("ไฟล์รูปภาพไม่ถูกต้อง (ต้องเป็นไฟล์รูปภาพเท่านั้น)");
      resetFileInput();
      return;
    }

    const maxMB = 5;
    const maxBytes = maxMB * 1024 * 1024;

    try {
      setErr("");

      // ถ้าไฟล์ใหญ่เกิน 5MB -> บีบอัดอัตโนมัติ
      let chosen = file;
      if (file.size > maxBytes) {
        chosen = await compressImageFile(file, {
          maxSize: 1024,
          quality: 0.82,
          mimeType: "image/webp",
        });

        if (chosen.size > maxBytes) {
          setErr(`ไฟล์ใหญ่เกินไป (เกิน ${maxMB}MB)`);
          resetFileInput();
          return;
        }
      }

      setAvatarFile(chosen);
      resetFileInput(); // เพื่อให้เลือกไฟล์เดิมซ้ำได้
    } catch {
      setErr("ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองไฟล์อื่น");
      resetFileInput();
    }
  }

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!fullName.trim()) return false;
    if (!email.trim()) return false;
    if (!courseId) return false;
    if (rating < 1 || rating > 5) return false;
    if (!title.trim()) return false;
    if (!body.trim()) return false;
    if (!consent) return false;
    return true;
  }, [submitting, fullName, email, courseId, rating, title, body, consent]);

  async function uploadAvatar(file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload/review-avatar", {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload failed");

    return data; // { ok:true, url, publicId }
  }

  async function submitReview(payload) {
    const res = await fetch("/api/public/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) throw new Error(j?.error || "Submit failed");
    return j;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      // 1) อัปโหลดรูปก่อน (ถ้ามี)
      let avatarUrl = "";
      let avatarPublicId = "";
      if (avatarFile) {
        const up = await uploadAvatar(avatarFile);
        avatarUrl = up.url || "";
        avatarPublicId = up.publicId || "";
      }

      // 2) ส่งรีวิว
      await submitReview({
        fullName,
        email,
        company,
        jobTitle,
        courseId,
        rating,
        title,
        body,
        consent,
        avatarUrl,
        avatarPublicId,
      });

      router.push("/thanks");
    } catch (e2) {
      setErr(String(e2?.message || "Submit failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-[#F6F8FC] text-slate-900">
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />

      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-semibold tracking-[0.25em] text-blue-600">
            SHARE YOUR EXPERIENCE
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            แบ่งปันประสบการณ์การเรียนรู้ของคุณ
          </h1>
          <p className="mt-4 text-slate-600">
            กรุณากรอกข้อมูลด้านล่าง เครื่องหมาย{" "}
            <span className={reqCls}>*</span> คือช่องที่จำเป็นต้องกรอก
          </p>
        </div>

        {/* Card */}
        <div className="mt-10 flex justify-center">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            {err && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <SectionTitle>ข้อมูลส่วนตัว</SectionTitle>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  ชื่อ-นามสกุล <span className={reqCls}>*</span>
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              <div>
                <label className={labelCls}>
                  อีเมล <span className={reqCls}>*</span>
                </label>
                <input
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
                <div className={hintCls}>
                  เพื่อใช้ในการยืนยันตัวตนเท่านั้น จะไม่ถูกเปิดเผยต่อสาธารณะ
                </div>
              </div>

              <div>
                <label className={labelCls}>บริษัท/องค์กร</label>
                <input
                  className={inputCls}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ไม่บังคับ"
                />
              </div>

              <div>
                <label className={labelCls}>ตำแหน่งงาน</label>
                <input
                  className={inputCls}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="ไม่บังคับ"
                />
              </div>
            </div>

            <SectionTitle2>ข้อมูลหลักสูตร</SectionTitle2>

            <div className="mt-6">
              <label className={labelCls}>
                หลักสูตรที่เรียน <span className={reqCls}>*</span>
              </label>

              <select
                className={cx(inputCls, "appearance-none")}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={loadingCourses}
              >
                <option value="">
                  {loadingCourses ? "กำลังโหลด..." : "-- เลือกหลักสูตร --"}
                </option>
                {[...courses]
                  .sort((a, b) => a.name.localeCompare(b.name, "th"))
                  .map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6">
              <label className={labelCls}>
                ให้คะแนนความพึงพอใจ <span className={reqCls}>*</span>
              </label>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    filled={rating >= n}
                    onClick={() => setRating(n)}
                  />
                ))}
                <span className="ml-3 text-sm text-slate-500">
                  {rating ? `${rating}/5` : ""}
                </span>
              </div>
            </div>

            <SectionTitle2>เขียนรีวิว</SectionTitle2>

            <div className="mt-6">
              <label className={labelCls}>
                หัวข้อรีวิว <span className={reqCls}>*</span>
              </label>
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='เช่น "ประทับใจมากครับ!"'
              />
            </div>

            <div className="mt-5">
              <label className={labelCls}>
                รายละเอียดรีวิว/คำชม <span className={reqCls}>*</span>
              </label>
              <textarea
                className={cx(inputCls, "min-h-[160px] resize-y")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="แบ่งปันประสบการณ์การเรียนรู้ของคุณ เช่น สิ่งที่ได้เรียนรู้ สิ่งที่ประทับใจ หรือการนำไปใช้ในงานจริง..."
              />
            </div>

            {/* Upload avatar */}
            <div className="mt-8">
              <div className="text-sm font-bold text-slate-900">
                อัปโหลดรูปโปรไฟล์
              </div>

              <div
                className={cx(
                  "mt-3 rounded-3xl border-2 border-dashed p-6 transition cursor-pointer",
                  "hover:border-blue-500 hover:bg-blue-50/30",
                  dragOver
                    ? "border-blue-300 bg-blue-50/60"
                    : "border-slate-200 bg-slate-50/60",
                )}
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer?.files?.[0];
                  if (f) pickImage(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />

                {!avatarPreview ? (
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                      <ImageIcon className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="flex-1 text-center">
                      <div className="font-semibold text-slate-700">
                        คลิกเพื่ออัปโหลด หรือ ลากไฟล์มาวาง
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        หากท่านอัปโหลดรูปภาพ
                        ท่านยินยอมให้เราใช้รูปภาพเพื่อประกอบคำคัดย่อของท่าน
                        <div className="mt-1 text-[11px] text-slate-400">
                          * ระบบจะบีบอัดรูปอัตโนมัติหากไฟล์ใหญ่เกิน 5MB
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarPreview}
                        alt="avatar preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {avatarFile?.name || "รูปโปรไฟล์"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        คลิกเพื่อเปลี่ยนรูป หรือ ลากไฟล์ใหม่มาวางทับ
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarFile(null);
                        resetFileInput();
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 hover:bg-slate-50"
                      aria-label="remove avatar"
                    >
                      <X className="h-5 w-5 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Consent */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col">
                  <div className="flex flex-row gap-3 items-center">
                    <div className="mt-1 flex shrink-0 items-center justify-center  text-blue-600 ">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      การให้ความยินยอมในการใช้ข้อมูล
                    </div>
                  </div>

                  <label className="group mt-3 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />

                    <div className="text-sm leading-6 text-slate-600 transition group-hover:text-slate-900">
                      ข้าพเจ้าได้อ่านและยอมรับใน{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTerms(true);
                        }}
                        className="cursor-pointer font-semibold text-blue-700 underline decoration-blue-700/30 underline-offset-4 transition hover:text-blue-800 hover:decoration-blue-800"
                      >
                        ข้อตกลงและเงื่อนไขการให้ความยินยอมเผยแพร่คำนิยม
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <button
              className={cx(
                "mt-8 w-full rounded-2xl px-5 py-4 text-lg font-bold transition",
                canSubmit
                  ? "bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-[0.99]"
                  : "cursor-not-allowed bg-slate-200 text-slate-500",
              )}
              disabled={!canSubmit}
              type="submit"
            >
              {submitting ? "กำลังส่ง..." : "ส่งรีวิวของฉัน"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
