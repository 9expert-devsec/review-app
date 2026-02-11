"use client";

import { useEffect, useMemo, useState } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function FieldLabel({ children }) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {children}
    </label>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={cx(
              "text-2xl transition",
              active ? "text-amber-400" : "text-slate-300 hover:text-slate-400",
            )}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function WriteReviewForm() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [courseId, setCourseId] = useState("");
  const [stars, setStars] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : ""),
    [avatarFile],
  );

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/public/courses", { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        setCourses(Array.isArray(j?.items) ? j.items : []);
      } catch {
        if (!alive) return;
        setCourses([]);
      } finally {
        if (!alive) return;
        setLoadingCourses(false);
      }
    })();
    return () => {
      alive = false;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    courseId.trim() &&
    stars >= 1 &&
    title.trim() &&
    body.trim() &&
    acceptedTerms &&
    !submitting;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("email", email);
      fd.append("company", company);
      fd.append("jobTitle", jobTitle);

      fd.append("courseId", courseId);
      fd.append("stars", String(stars));
      fd.append("title", title);
      fd.append("body", body);

      fd.append("acceptedTerms", acceptedTerms ? "true" : "false");
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await fetch("/api/reviews", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(j?.error || "ส่งรีวิวไม่สำเร็จ");
        return;
      }

      location.href = "/thanks";
    } catch {
      setErr("ส่งรีวิวไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* ข้อมูลส่วนตัว */}
      <section>
        <h2 className="text-lg font-extrabold">ข้อมูลส่วนตัว</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>

          <div>
            <FieldLabel>
              อีเมล <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
            <div className="mt-1 text-xs text-slate-400">
              เพื่อใช้ในการยืนยันตัวตนเท่านั้น จะไม่ถูกเปิดเผยต่อสาธารณะ
            </div>
          </div>

          <div>
            <FieldLabel>บริษัท/องค์กร</FieldLabel>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <div>
            <FieldLabel>ตำแหน่งงาน</FieldLabel>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>
        </div>
      </section>

      {/* ข้อมูลหลักสูตร */}
      <section>
        <h2 className="text-lg font-extrabold">ข้อมูลหลักสูตร</h2>

        <div className="mt-6">
          <FieldLabel>
            หลักสูตรที่เรียน <span className="text-red-500">*</span>
          </FieldLabel>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={loadingCourses}
          >
            <option value="">
              {loadingCourses ? "กำลังโหลด..." : "-- เลือกหลักสูตร --"}
            </option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {!loadingCourses && courses.length === 0 && (
            <div className="mt-2 text-sm text-amber-700">
              ยังไม่มีรายการหลักสูตรในระบบ (เดี๋ยวเราจะทำ Sync จาก API
              นอกในขั้นถัดไป)
            </div>
          )}
        </div>

        <div className="mt-6">
          <FieldLabel>
            ให้คะแนนความพึงพอใจ <span className="text-red-500">*</span>
          </FieldLabel>
          <div className="mt-2">
            <StarPicker value={stars} onChange={setStars} />
          </div>
        </div>
      </section>

      {/* เขียนรีวิว */}
      <section>
        <h2 className="text-lg font-extrabold">เขียนรีวิว</h2>

        <div className="mt-6">
          <FieldLabel>
            หัวข้อรีวิว <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='เช่น "ประทับใจมากครับ!"'
          />
        </div>

        <div className="mt-6">
          <FieldLabel>
            รายละเอียดรีวิว/คำยืนยัน <span className="text-red-500">*</span>
          </FieldLabel>
          <textarea
            className="mt-2 min-h-[140px] w-full rounded-xl border border-slate-200 px-4 py-3"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="แบ่งปันประสบการณ์การเรียนรู้ของคุณ เช่น สิ่งที่ได้เรียนรู้ สิ่งที่ประทับใจ หรือการนำไปใช้ในงานจริง..."
          />
        </div>
      </section>

      {/* อัปโหลดรูป */}
      <section>
        <h2 className="text-lg font-extrabold">อัปโหลดรูปโปรไฟล์</h2>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              คลิกเพื่ออัปโหลด หรือ ลากไฟล์มาวาง (ไม่เกิน 5MB)
            </div>

            <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium">
              เลือกไฟล์
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {avatarPreview && (
            <div className="mt-4 flex items-center gap-4">
              <img
                src={avatarPreview}
                alt="preview"
                className="h-16 w-16 rounded-2xl object-cover"
              />
              <button
                type="button"
                className="text-sm font-medium text-red-600"
                onClick={() => setAvatarFile(null)}
              >
                ลบรูป
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Consent + Submit */}
      <section>
        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <div className="text-sm text-slate-700">
              ข้าพเจ้าได้อ่านและยอมรับใน{" "}
              <span className="font-semibold text-blue-700">
                ข้อตกลงและเงื่อนไข
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={cx(
            "mt-6 w-full rounded-2xl px-6 py-4 text-base font-semibold",
            canSubmit
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-500",
          )}
        >
          {submitting ? "กำลังส่ง..." : "ส่งรีวิวของฉัน"}
        </button>
      </section>
    </form>
  );
}
