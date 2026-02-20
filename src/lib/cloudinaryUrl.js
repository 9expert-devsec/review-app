// src/lib/cloudinaryUrl.js
export function cldFullFromPublicId(publicId) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !publicId) return "";
  // ✅ full (ไม่ใส่ w/h)
  return `https://res.cloudinary.com/${cloud}/image/upload/q_auto,f_auto/${publicId}`;
}
