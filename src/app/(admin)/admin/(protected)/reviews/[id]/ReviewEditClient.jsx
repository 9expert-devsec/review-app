// src/app/(admin)/admin/(protected)/reviews/[id]/ReviewEditClient.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ImageLightbox from "@/components/ui/ImageLightbox";

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
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      <span
        className={cx(
          "size-2 rounded-full",
          on ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {children}
    </span>
  );
}

function Switch({ checked, onChange, labelOn, labelOff }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
        checked
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">
          {checked ? labelOn : labelOff}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {checked ? "จะแสดงบนหน้า Landing" : "จะไม่ถูกนำไปแสดงหน้า Landing"}
        </div>
      </div>

      <div
        className={cx(
          "relative h-7 w-12 rounded-full border transition",
          checked
            ? "border-emerald-200 bg-emerald-500"
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

const MAX_AVATAR_MB = 5;

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
    if (!clean(headline)) return false;
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) return false;
    return true;
  }, [courseId, reviewerName, reviewerEmail, headline, rating]);

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

    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarErr(`ไฟล์ใหญ่เกินไป (เกิน ${MAX_AVATAR_MB}MB)`);
      return;
    }

    // เลือกรูปใหม่ = ไม่ลบรูป (แทนที่)
    setAvatarRemove(false);
    setAvatarFile(file);
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
      }

      const r = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.error || "Save failed");

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
      {/* Lightbox */}
      <ImageLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl("")}
        alt="avatar"
      />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link href={`${adminBase}/reviews`} className="hover:underline">
              Reviews
            </Link>{" "}
            <span className="mx-1">/</span> Edit
          </div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Edit Review
          </div>
          <div className="mt-1 text-xs text-slate-500 break-all">{id}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${adminBase}/reviews`}>← กลับไป List</Link>
          <button
            onClick={remove}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            ลบ
          </button>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      )}
      {okMsg && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          {okMsg}
        </div>
      )}

      {/* Body */}
      {loading || !item ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-slate-500">
          Loading...
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-slate-900">
                  Review Details
                </div>
                <Pill on={!!isActive}>{isActive ? "Active" : "Off"}</Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Course" required hint="เลือกคอร์สที่รีวิว">
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                  />
                </Field>

                <Field label="อีเมล" required>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                  />
                </Field>

                <Field label="บริษัท/องค์กร">
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={reviewerCompany}
                    onChange={(e) => setReviewerCompany(e.target.value)}
                  />
                </Field>

                <Field label="ตำแหน่งงาน">
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
                              "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                              on
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            )}
                            title={`${v} ดาว`}
                          >
                            {v} ★
                          </button>
                        );
                      })}
                      <div className="ml-1 text-sm font-semibold text-slate-700">
                        {starsText(rating)}
                      </div>
                      <div className="ml-auto">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
                  <Field label="หัวข้อรีวิว" required>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="รายละเอียดรีวิว/คำติชม">
                    <textarea
                      rows={7}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    {dirty ? (
                      <span className="font-semibold text-amber-700">
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
                    <Link
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      href={`${adminBase}/reviews`}
                    >
                      ยกเลิก
                    </Link>
                    <button
                      disabled={!canSave || saving || avatarBusy}
                      onClick={save}
                      className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Preview (Landing)
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    ดูคร่าว ๆ ว่าจะขึ้นหน้าเว็บยังไง
                  </div>
                </div>
                <Pill on={!!isActive}>{isActive ? "Active" : "Off"}</Pill>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-600">
                  Course
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900 line-clamp-2">
                  {selectedCourseName}
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-1">
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
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      {clampRating(rating)}.0
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {starsText(rating)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-extrabold text-slate-900 line-clamp-2">
                    {clean(headline) || "-"}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment ? (
                      comment
                    ) : (
                      <span className="text-slate-400">
                        — ไม่มีรายละเอียด —
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar manager */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
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
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
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
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>

                {avatarErr ? (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {avatarErr}
                  </div>
                ) : null}

                <div className="mt-3">
                  {avatarDisplayUrl ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(avatarDisplayUrl)}
                        className="h-16 w-16 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
                        title="คลิกเพื่อดูรูปเต็ม"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarDisplayUrl}
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
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
                            href={avatarUrlCurrent}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-semibold text-blue-700 underline decoration-blue-700/30 underline-offset-4 hover:text-blue-800"
                          >
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
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          ยกเลิก
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
                      ไม่มีรูปโปรไฟล์
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
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
                  <div>
                    <span className="text-slate-500">Status:</span>{" "}
                    <span className="font-medium">{item.status || "-"}</span>
                  </div>
                </div>
              </div>

              {dirty ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  มีการแก้ไขที่ยังไม่บันทึก — กด “บันทึก” เพื่ออัปเดตข้อมูล
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
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
