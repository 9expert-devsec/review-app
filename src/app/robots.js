// src/app/robots.js
export default function robots() {
  const key = (process.env.ADMIN_PATH_KEY || "").trim();
  const disallow = ["/admin/"];
  if (key) disallow.push(`/${key}/admin/`);

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
  };
}