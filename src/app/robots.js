// src/app/robots.js
export default function robots() {
  const key = (process.env.ADMIN_PATH_KEY || "").trim();
  const disallow = ["/admin/"];

  // ล็อกหน้าทางเข้าลับจริง
  if (key) disallow.push(`/${key}/login`);

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
  };
}