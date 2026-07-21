// src/app/(admin)/admin/(protected)/reviews/[id]/ReviewEditClient.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Upload,
  ImageOff,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import ImageLightbox from "@/components/ui/ImageLightbox";
import AvatarCropModal from "@/components/ui/AvatarCropModal";
import {
  cloudinaryAvatarThumb,
  cloudinaryAvatarFull,
} from "@/lib/cloudinaryUrl.client";

function getAdminBase(pathname) {
  const p = String(pathname || "");
  const i = p.indexOf("/admin");
  if (i === -1) return "/admin";
  return p.slice(0, i) + "/admin";
}

function clean(x) {
  return String(x || "").trim();
}

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function formatBKK(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function clampRating(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function starsText(rating) {
  const n = clampRating(rating);
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-semibold text-slate-600">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-400">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Pill({ on, children }) {
  return (
    <span className={cx("badge", on ? "badge-active" : "badge-muted")}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}

function formatBytes(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(x) / Math.log(1024)),
  );
  const v = x / Math.pow(1024, i);
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

async function compressBlobToMaxBytes(blob, maxBytes) {
  // blob ที่ได้จาก crop เป็น jpeg แล้ว (512x512) ส่วนใหญ่ไม่ใหญ่มาก
  // แต่เผื่อไว้: ถ้าเกิน maxBytes ให้ลด quality ลง
  if (blob.size <= maxBytes) return blob;

  const imgUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = imgUrl;
    await new Promise((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("อ่านรูปไม่สำเร็จ"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, 512, 512);

    let out = blob;
    for (let q = 0.9; q >= 0.55; q -= 0.05) {
      const b = await new Promise((res, rej) => {
        canvas.toBlob(
          (x) => (x ? res(x) : rej(new Error("แปลงรูปไม่สำเร็จ"))),
          "image/jpeg",
          q,
        );
      });
      out = b;
      if (b.size <= maxBytes) break;
    }
    return out;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("อ่านรูปไม่สำเร็จ"));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToBlob(canvas, type, quality) {
  return await new Promise((res, rej) => {
    canvas.toBlob(
      (b) => {
        if (!b) return rej(new Error("แปลงรูปไม่สำเร็จ"));
        res(b);
      },
      type,
      quality,
    );
  });
}

async function compressImageToMaxBytes(file, maxBytes) {
  const originalBytes = file.size || 0;
  if (originalBytes <= maxBytes) {
    return {
      file,
      didCompress: false,
      originalBytes,
      finalBytes: originalBytes,
    };
  }

  const img = await fileToImage(file);

  // สำหรับ avatar ไม่ต้องใหญ่เกินนี้
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;

  // ลดขนาดภาพก่อน
  const MAX_SIDE = 1600;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  // ลองลด quality ทีละขั้น
  let bestBlob = null;
  let bestQ = 0.92;

  for (let q = 0.92; q >= 0.6; q -= 0.06) {
    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    bestBlob = blob;
    bestQ = q;
    if (blob.size <= maxBytes) break;
  }

  // ถ้ายังใหญ่ไปอีก ลดมิติอีกรอบ
  if (bestBlob && bestBlob.size > maxBytes) {
    const shrink = 0.85;
    const w2 = Math.max(1, Math.round(w * shrink));
    const h2 = Math.max(1, Math.round(h * shrink));
    canvas.width = w2;
    canvas.height = h2;
    ctx.drawImage(img, 0, 0, w2, h2);

    for (let q = bestQ; q >= 0.55; q -= 0.05) {
      const blob = await canvasToBlob(canvas, "image/jpeg", q);
      bestBlob = blob;
      if (blob.size <= maxBytes) break;
    }
  }

  const finalBytes = bestBlob?.size || originalBytes;

  const nameBase = (file.name || "avatar").replace(/\.[^/.]+$/, "");
  const outFile = new File([bestBlob], `${nameBase}.jpg`, {
    type: "image/jpeg",
  });

  return { file: outFile, didCompress: true, originalBytes, finalBytes };
}

function Switch({ checked, onChange, labelOn, labelOff }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
        checked
          ? "border-(--brand-blue)/25 bg-(--brand-blue-bright)/10"
          : "border-slate-200 bg-white hover:bg-brand-ice",
      )}
    >
      <div>
        <div className="text-sm font-semibold text-brand-navy">
          {checked ? labelOn : labelOff}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {checked ? "จะแสดงบนหน้า Landing" : "จะไม่ถูกนำไปแสดงหน้า Landing"}
        </div>
      </div>

      <div
        className={cx(
          "relative h-7 w-12 rounded-full border transition-all",
          checked
            ? "border-brand-blue bg-brand-blue-bright"
            : "border-slate-200 bg-slate-100",
        )}
      >
        <div
          className={cx(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition",
            checked ? "right-1" : "left-1",
          )}
        />
      </div>
    </button>
  );
}

export default function ReviewEditClient({ id }) {
  const router = useRouter();
  const pathname = usePathname();
  const adminBase = useMemo(() => getAdminBase(pathname), [pathname]);

  const [courses, setCourses] = useState([]);
  const [item, setItem] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // form fields
  const [courseId, setCourseId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerCompany, setReviewerCompany] = useState("");
  const [reviewerRole, setReviewerRole] = useState("");
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [isActive, setIsActive] = useState(false);

  // avatar controls (admin)
  const fileRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null); // File ที่เลือกใหม่ (ยังไม่อัปโหลดจนกดบันทึก)
  const [avatarPreview, setAvatarPreview] = useState(""); // objectURL
  const [avatarRemove, setAvatarRemove] = useState(false); // ตั้งใจลบรูปเดิม
  const [avatarBusy, setAvatarBusy] = useState(false); // ตอนอัปโหลดรูป
  const [avatarErr, setAvatarErr] = useState("");
  const [avatarInfo, setAvatarInfo] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropSrc, setCropSrc] = useState(""); // objectURL ของไฟล์ที่เลือก
  const [cropFileName, setCropFileName] = useState("avatar.jpg");

  const initialRef = useRef(null);

  const selectedCourseName = useMemo(() => {
    const cid = String(courseId || "");
    const found = courses.find((c) => String(c._id || c.id) === cid);
    return found?.name || item?.courseName || "-";
  }, [courseId, courses, item]);

  const canSave = useMemo(() => {
    if (!courseId) return false;
    if (!clean(reviewerName)) return false;
    if (!clean(reviewerEmail)) return false;
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) return false;
    return true;
  }, [courseId, reviewerName, reviewerEmail, rating]);

  const avatarUrlCurrent = clean(item?.avatarUrl) || "";
  const avatarPublicIdCurrent = clean(item?.avatarPublicId) || "";

  // แสดงรูปที่ "ควร" ใช้ใน UI ตอนนี้:
  // - ถ้าเลือกไฟล์ใหม่ => preview
  // - ถ้ากดลบรูป => ไม่มีรูป
  // - ไม่งั้นใช้ของเดิมจาก item
  const avatarDisplayUrl = useMemo(() => {
    if (avatarRemove) return "";
    if (avatarPreview) return avatarPreview;
    return avatarUrlCurrent;
  }, [avatarRemove, avatarPreview, avatarUrlCurrent]);

  const dirty = useMemo(() => {
    if (!initialRef.current) return false;

    const baseNow = {
      courseId: String(courseId || ""),
      reviewerName: clean(reviewerName),
      reviewerEmail: clean(reviewerEmail),
      reviewerCompany: clean(reviewerCompany),
      reviewerRole: clean(reviewerRole),
      rating: clampRating(rating),
      headline: clean(headline),
      comment: String(comment || ""),
      isActive: !!isActive,
      avatarUrl: avatarRemove ? "" : initialRef.current.avatarUrl, // base compare: ถ้าลบรูปถือว่า url ว่าง
      avatarPublicId: avatarRemove ? "" : initialRef.current.avatarPublicId,
    };

    const baseInitial = initialRef.current;

    const baseDirty = JSON.stringify(baseNow) !== JSON.stringify(baseInitial);

    // avatarFile = เลือกรูปใหม่ ยังไม่อัปโหลด => ถือว่า dirty
    const avatarFileDirty = !!avatarFile;

    // avatarRemove dirty เฉพาะตอนมีรูปเดิมจริง ๆ
    const avatarRemoveDirty = avatarRemove && !!baseInitial.avatarUrl;

    return baseDirty || avatarFileDirty || avatarRemoveDirty;
  }, [
    courseId,
    reviewerName,
    reviewerEmail,
    reviewerCompany,
    reviewerRole,
    rating,
    headline,
    comment,
    isActive,
    avatarFile,
    avatarRemove,
  ]);

  async function loadCourses() {
    const r = await fetch("/api/admin/courses", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      throw new Error(j?.error || `Load courses failed (${r.status})`);
    }
    setCourses(j.items || []);
  }

  async function loadItem() {
    const r = await fetch(`/api/admin/reviews/${id}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error(j.error || "Load failed");
    return j.item;
  }

  useEffect(() => {
    function onBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;

    const safeId = String(id || "").trim();
    if (!safeId || safeId === "undefined") {
      setErr("Invalid id");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setOkMsg("");
        setAvatarErr("");

        await loadCourses();
        const it = await loadItem();
        if (!alive) return;

        setItem(it);

        const next = {
          courseId: String(it.courseId || ""),
          reviewerName: it.reviewerName || it.fullName || "",
          reviewerEmail: it.reviewerEmail || it.email || "",
          reviewerCompany: it.reviewerCompany || it.company || "",
          reviewerRole: it.reviewerRole || it.jobTitle || "",
          rating: clampRating(it.rating || 5),
          headline: it.headline || it.title || "",
          comment: it.comment || it.body || "",
          isActive: !!it.isActive,
          avatarUrl: clean(it.avatarUrl) || "",
          avatarPublicId: clean(it.avatarPublicId) || "",
        };

        setCourseId(next.courseId);
        setReviewerName(next.reviewerName);
        setReviewerEmail(next.reviewerEmail);
        setReviewerCompany(next.reviewerCompany);
        setReviewerRole(next.reviewerRole);
        setRating(next.rating);
        setHeadline(next.headline);
        setComment(next.comment);
        setIsActive(next.isActive);

        // reset avatar controls
        setAvatarFile(null);
        setAvatarRemove(false);
        setAvatarErr("");

        initialRef.current = next;
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function pickAvatar(file) {
    if (!file) return;

    setAvatarErr("");

    if (!file.type?.startsWith("image/")) {
      setAvatarErr("ไฟล์รูปภาพไม่ถูกต้อง (ต้องเป็นไฟล์รูปภาพเท่านั้น)");
      return;
    }

    // ✅ ไม่บล็อคขนาดแล้ว → ครอปแล้วค่อยได้ไฟล์ใหม่ที่เล็กลงเอง
    setAvatarRemove(false);

    // เปิด modal ครอป
    setCropFile(file);
    setCropOpen(true);

    // ให้เลือกไฟล์เดิมซ้ำได้
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadAvatar(file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload/review-avatar", {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload failed");
    return data; // { ok:true, url, publicId, ... }
  }

  async function save() {
    // ติดตามว่าเพิ่งอัปโหลดรูปใหม่ในรอบนี้หรือไม่ เพื่อแจ้ง error ให้ชัดเจน
    // ถ้า PUT ล้มเหลวหลังอัปโหลดรูปสำเร็จ (รูปจะค้างบน Cloudinary แต่ DB ไม่อัปเดต)
    let uploadedThisSave = false;
    try {
      setSaving(true);
      setErr("");
      setOkMsg("");
      setAvatarErr("");

      if (!canSave) {
        throw new Error(
          "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (ชื่อ/อีเมล/หัวข้อ/หลักสูตร/คะแนน)",
        );
      }

      const payload = {
        courseId,
        reviewerName: clean(reviewerName),
        reviewerEmail: clean(reviewerEmail),
        reviewerCompany: clean(reviewerCompany),
        reviewerRole: clean(reviewerRole),
        rating: clampRating(rating),
        headline: clean(headline),
        comment: String(comment || ""),
        isActive: !!isActive,
      };

      // ---- Avatar logic ----
      // 1) ถ้าตั้งใจลบรูป -> ส่ง avatarAction: "remove"
      // 2) ถ้าเลือกไฟล์ใหม่ -> อัปโหลดก่อน แล้วแนบ avatarUrl/publicId ไปกับ PUT
      if (avatarRemove && (avatarUrlCurrent || avatarPublicIdCurrent)) {
        payload.avatarAction = "remove";
      } else if (avatarFile) {
        setAvatarBusy(true);
        const up = await uploadAvatar(avatarFile);
        payload.avatarUrl = clean(up.url);
        payload.avatarPublicId = clean(up.publicId);
        uploadedThisSave = true;
      }

      const r = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        // รูปอัปโหลดขึ้น Cloudinary แล้วแต่บันทึกลง DB ไม่สำเร็จ
        // ไม่ลบรูปอัตโนมัติ (ให้ผู้ใช้กดบันทึกซ้ำได้) แต่แจ้งให้ชัดเจน
        if (uploadedThisSave) {
          throw new Error(
            `${j.error || "Save failed"} — อัปโหลดรูปสำเร็จแต่บันทึกข้อมูลไม่สำเร็จ กรุณากดบันทึกอีกครั้ง`,
          );
        }
        throw new Error(j.error || "Save failed");
      }

      setItem(j.item);

      initialRef.current = {
        courseId: String(payload.courseId || ""),
        reviewerName: payload.reviewerName,
        reviewerEmail: payload.reviewerEmail,
        reviewerCompany: payload.reviewerCompany,
        reviewerRole: payload.reviewerRole,
        rating: payload.rating,
        headline: payload.headline,
        comment: payload.comment,
        isActive: payload.isActive,
        avatarUrl: clean(j.item?.avatarUrl) || "",
        avatarPublicId: clean(j.item?.avatarPublicId) || "",
      };

      // reset avatar UI after saved
      setAvatarFile(null);
      setAvatarRemove(false);
      setAvatarErr("");

      setOkMsg("บันทึกสำเร็จ");
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setAvatarBusy(false);
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("ยืนยันลบรีวิวนี้?")) return;
    const r = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return alert(j.error || "Delete failed");
    router.push(`${adminBase}/reviews`);
  }

  return (
    <div>
      <AvatarCropModal
        open={cropOpen}
        file={cropFile}
        onClose={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
        onConfirm={(cropped) => {
          // ✅ ได้ไฟล์ที่ครอปแล้ว (square) พร้อมอัปโหลดตอนกดบันทึก
          setAvatarFile(cropped);
          setAvatarRemove(false);
          setAvatarErr("");
        }}
        outputSize={800}
      />
      {/* Lightbox */}
      <ImageLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl("")}
        alt="avatar"
      />

      {/* <AvatarCropModal
        open={cropOpen}
        src={cropSrc}
        fileName={cropFileName}
        onCancel={() => {
          setCropOpen(false);
          // ไม่ล้าง cropSrc ทันทีเพื่อไม่ให้ modal กระพริบ แต่ถ้าจะล้างก็ได้
        }}
        onConfirm={async ({ blob, previewUrl, info }) => {
          try {
            setAvatarBusy(true);
            setAvatarErr("");
            setAvatarInfo(info || "");

            // ✅ บีบอัดหลังครอป (ไม่บล็อคไฟล์ใหญ่ แต่กันอัปโหลดพัง)
            const TARGET_BYTES = Math.floor(4.2 * 1024 * 1024);
            const outBlob = await compressBlobToMaxBytes(blob, TARGET_BYTES);

            // แปลงเป็น File เพื่อไป upload แบบเดิม
            const f = new File([outBlob], "avatar.jpg", { type: "image/jpeg" });

            // อัปเดต state ให้ preview ในหน้าเป็นรูปที่ครอปแล้ว
            setAvatarFile(f);

            // ปิด modal
            setCropOpen(false);

            // ตั้ง info
            setAvatarInfo(
              `ครอปแล้ว: ${formatBytes(blob.size)} → ${formatBytes(outBlob.size)}`,
            );
          } catch (e) {
            setAvatarErr(e?.message || "ครอป/บีบอัดไม่สำเร็จ");
          } finally {
            setAvatarBusy(false);
          }
        }}
      /> */}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link
              href={`${adminBase}/reviews`}
              className="font-medium text-brand-blue hover:underline"
            >
              Reviews
            </Link>{" "}
            <span className="mx-1 text-slate-300">/</span> Edit
          </div>
          <div className="mt-1 font-head text-2xl font-extrabold tracking-tight text-brand-navy">
            Edit Review
          </div>
          <div className="mt-1 text-xs text-slate-400 break-all">{id}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${adminBase}/reviews`} className="btn-ghost">
            <ArrowLeft className="size-4" />
            กลับไป List
          </Link>
          <button onClick={remove} className="btn-danger">
            <Trash2 className="size-4" />
            ลบ
          </button>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {okMsg && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <span>{okMsg}</span>
        </div>
      )}

      {/* Body */}
      {loading || !item ? (
        <div className="card mt-6 p-5 text-slate-500">Loading...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="font-head text-base font-semibold text-brand-navy">
                  Review Details
                </div>
                <Pill on={!!isActive}>{isActive ? "Active" : "Off"}</Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Course" required hint="เลือกคอร์สที่รีวิว">
                    <select
                      className="input"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                    >
                      <option value="">เลือกหลักสูตร</option>
                      {courses.map((c) => (
                        <option
                          key={String(c._id || c.id)}
                          value={String(c._id || c.id)}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="ชื่อ-นามสกุล" required>
                  <input
                    className="input"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                  />
                </Field>

                <Field label="อีเมล" required>
                  <input
                    className="input"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                  />
                </Field>

                <Field label="บริษัท/องค์กร">
                  <input
                    className="input"
                    value={reviewerCompany}
                    onChange={(e) => setReviewerCompany(e.target.value)}
                  />
                </Field>

                <Field label="ตำแหน่งงาน">
                  <input
                    className="input"
                    value={reviewerRole}
                    onChange={(e) => setReviewerRole(e.target.value)}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="คะแนน" required hint="คลิกเลือกดาว">
                    <div className="flex flex-wrap items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const v = i + 1;
                        const on = v <= clampRating(rating);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setRating(v)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-sm font-semibold transition-all active:scale-95",
                              on
                                ? "border-brand-blue bg-brand-blue-bright text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-brand-ice",
                            )}
                            title={`${v} ดาว`}
                          >
                            {v} ★
                          </button>
                        );
                      })}
                      <div className="ml-1 text-sm font-semibold text-brand-lime-dark">
                        {starsText(rating)}
                      </div>
                      <div className="ml-auto">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="input w-24"
                          value={rating}
                          onChange={(e) =>
                            setRating(clampRating(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="หัวข้อรีวิว">
                    <input
                      className="input"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="รายละเอียดรีวิว/คำติชม">
                    <textarea
                      rows={7}
                      className="input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Visibility"
                    hint="เปิด/ปิดการแสดงบนหน้า Landing"
                  >
                    <Switch
                      checked={!!isActive}
                      onChange={setIsActive}
                      labelOn="Active (แสดงหน้า Landing)"
                      labelOff="Off Active (ไม่แสดงหน้า Landing)"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Sticky actions */}
            <div className="sticky bottom-4 mt-4">
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-(--shadow-soft-lg) backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    {dirty ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="size-2 rounded-full bg-amber-500" />
                        มีการแก้ไขที่ยังไม่บันทึก
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        ไม่มีการเปลี่ยนแปลง
                      </span>
                    )}
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-500">
                      Created:{" "}
                      <span className="font-medium">
                        {formatBKK(item.createdAt)}
                      </span>
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-500">
                      Updated:{" "}
                      <span className="font-medium">
                        {formatBKK(item.updatedAt)}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Link className="btn-ghost" href={`${adminBase}/reviews`}>
                      ยกเลิก
                    </Link>
                    <button
                      disabled={!canSave || !dirty || saving || avatarBusy}
                      onClick={save}
                      className="btn-primary px-5!"
                    >
                      {avatarBusy
                        ? "กำลังอัปโหลดรูป..."
                        : saving
                          ? "กำลังบันทึก..."
                          : "บันทึก"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-head text-sm font-semibold text-brand-navy">
                    Preview (Landing)
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    ดูคร่าว ๆ ว่าจะขึ้นหน้าเว็บยังไง
                  </div>
                </div>
                <Pill on={!!isActive}>{isActive ? "Active" : "Off"}</Pill>
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-(--shadow-soft)">
                <div className="h-1.5 w-full bg-linear-to-r from-brand-blue via-brand-sky to-brand-lime" />
                <div className="p-5">
                  {/* Course = public testimonial title (const title = course || headline) */}
                  <div className="font-head text-lg font-extrabold leading-snug text-brand-navy line-clamp-2">
                    {selectedCourseName}
                  </div>

                  {/* Rating stars */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg leading-none text-brand-lime-dark">
                      {starsText(rating)}
                    </span>
                    <span className="text-sm font-extrabold text-brand-navy">
                      {clampRating(rating)}.0
                    </span>
                  </div>

                  {/* Body */}
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment ? (
                      comment
                    ) : (
                      <span className="text-slate-400">
                        — ไม่มีรายละเอียด —
                      </span>
                    )}
                  </div>

                  {/* Reviewer */}
                  <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--brand-blue-bright)/10 text-sm font-bold text-brand-blue">
                      {avatarDisplayUrl ? (
                        <img
                          src={
                            cloudinaryAvatarThumb(avatarDisplayUrl, 80) ||
                            avatarDisplayUrl
                          }
                          alt="avatar"
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        (clean(reviewerName) || "?").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-brand-navy line-clamp-1">
                        {clean(reviewerName) || "-"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {clean(reviewerRole) || ""}
                        {clean(reviewerRole) && clean(reviewerCompany)
                          ? " • "
                          : ""}
                        {clean(reviewerCompany) || ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar manager */}
              <div className="card mt-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">
                      Avatar (รูปโปรไฟล์)
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      เลือกรูปใหม่/ลบรูปเดิม แล้วกด “บันทึก”
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickAvatar(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="btn-ghost min-h-9! px-3! text-xs!"
                    >
                      <Upload className="size-4" />
                      อัปโหลดใหม่
                    </button>
                    <button
                      type="button"
                      disabled={!avatarUrlCurrent && !avatarPreview}
                      onClick={() => {
                        // ตั้งใจลบรูปเดิม + เคลียร์ไฟล์ใหม่ถ้ามี
                        setAvatarFile(null);
                        setAvatarRemove(true);
                        setAvatarErr("");
                      }}
                      className="btn-danger min-h-9! px-3! text-xs! disabled:opacity-50"
                    >
                      <ImageOff className="size-4" />
                      ลบรูป
                    </button>
                  </div>
                </div>

                {avatarErr ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{avatarErr}</span>
                  </div>
                ) : null}

                {avatarInfo ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-brand-ice px-3 py-2 text-xs text-slate-700">
                    {avatarInfo}
                  </div>
                ) : null}

                <div className="mt-3">
                  {avatarDisplayUrl ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-brand-ice p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxUrl(cloudinaryAvatarFull(avatarDisplayUrl))
                        }
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"
                        title="คลิกเพื่อดูรูปเต็ม"
                      >
                        {(() => {
                          const raw = avatarDisplayUrl || "";
                          const src = raw
                            ? cloudinaryAvatarThumb(raw, 160) || raw
                            : "";
                          if (!src) return null;

                          return (
                            <img
                              src={src}
                              alt="avatar"
                              className="h-full w-full object-cover object-top"
                            />
                          );
                        })()}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {avatarRemove
                            ? "กำลังจะลบรูป"
                            : avatarFile
                              ? "รูปใหม่ (ยังไม่บันทึก)"
                              : "รูปปัจจุบัน"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {avatarFile
                            ? `ไฟล์: ${avatarFile.name} • จะอัปโหลดเมื่อกดบันทึก`
                            : "คลิกที่รูปเพื่อเปิดดูเต็ม"}
                        </div>

                        {!avatarFile && avatarUrlCurrent ? (
                          <a
                            href={cloudinaryAvatarFull(avatarUrlCurrent)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue underline decoration-(--brand-blue)/30 underline-offset-4 hover:text-brand-blue-bright"
                          >
                            <ExternalLink className="size-3.5" />
                            เปิดรูปในแท็บใหม่
                          </a>
                        ) : null}
                      </div>

                      {avatarFile || avatarRemove ? (
                        <button
                          type="button"
                          onClick={() => {
                            // ยกเลิกการเปลี่ยนแปลง avatar
                            setAvatarFile(null);
                            setAvatarRemove(false);
                            setAvatarErr("");
                          }}
                          className="btn-ghost min-h-9! px-3! text-xs!"
                        >
                          <X className="size-4" />
                          ยกเลิก
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-brand-ice px-3 py-8 text-center text-xs text-slate-500">
                      ไม่มีรูปโปรไฟล์
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="card mt-4 p-4">
                <div className="text-xs font-semibold text-slate-600">
                  Quick Info
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-500">Email:</span>{" "}
                    <span className="font-medium">
                      {clean(reviewerEmail) || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Status:</span>{" "}
                    <span className="font-medium">{item.status || "-"}</span>
                  </div>
                </div>
              </div>

              {dirty ? (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    มีการแก้ไขที่ยังไม่บันทึก — กด “บันทึก” เพื่ออัปเดตข้อมูล
                  </span>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-brand-ice p-4 text-sm text-slate-600">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ข้อมูลล่าสุดถูกบันทึกแล้ว
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
