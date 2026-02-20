// src/lib/cloudinaryUrl.client.js

function extractPublicId(input) {
  const s = String(input || "").trim();
  if (!s) return "";

  // ถ้าเป็น publicId อยู่แล้ว (ไม่ใช่ http/blob/data)
  if (!/^(https?:\/\/|blob:|data:)/i.test(s)) {
    return s.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, "");
  }

  const marker = "/image/upload/";
  const i = s.indexOf(marker);
  if (i === -1) return ""; // ไม่ใช่ cloudinary url

  const after = s.slice(i + marker.length);
  const parts = after.split("/").filter(Boolean);

  const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  const tail = (vIdx >= 0 ? parts.slice(vIdx + 1) : parts).join("/");

  return tail.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, "");
}

function isUrlLike(s) {
  return /^(https?:\/\/|blob:|data:)/i.test(String(s || ""));
}

export function cloudinaryAvatarThumb(srcOrPublicId, size = 96) {
  const raw = String(srcOrPublicId || "").trim();
  if (!raw) return "";

  // ถ้าเป็น blob/data ให้ใช้ตรง ๆ (ห้ามไปแปลง)
  if (/^(blob:|data:)/i.test(raw)) return raw;

  const publicId = extractPublicId(raw);

  // ถ้าหา publicId ไม่ได้ แต่เป็น url ก็คืน url เดิมไปเลย (กัน src="")
  if (!publicId) return isUrlLike(raw) ? raw : "";

  const t = `c_fill,g_auto,w_${size},h_${size},q_auto,f_auto`;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // ถ้าไม่มี cloud name ให้ fallback เป็น url เดิม
  if (!cloud) return isUrlLike(raw) ? raw : "";

  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${publicId}`;
}

export function cloudinaryAvatarFull(srcOrPublicId, size = 800) {
  const raw = String(srcOrPublicId || "").trim();
  if (!raw) return "";

  if (/^(blob:|data:)/i.test(raw)) return raw;

  const publicId = extractPublicId(raw);
  if (!publicId) return isUrlLike(raw) ? raw : "";

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return isUrlLike(raw) ? raw : "";

  const t = `c_limit,w_${size},h_${size},q_auto,f_auto`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${publicId}`;
}
