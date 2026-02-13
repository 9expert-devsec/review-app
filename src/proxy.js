// src/proxy.js
import { NextResponse } from "next/server";

const KEY = String(process.env.ADMIN_PATH_KEY || "").trim();

function isPublicAsset(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api")
  );
}

export default function proxy(req) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (isPublicAsset(pathname)) return NextResponse.next();

  // 1) เข้าผ่าน Secret Path: /sP2vM7.../login -> ให้ไปที่หน้า /admin/login จริงๆ
  if (KEY && pathname === `/${KEY}/login`) {
    const u = url.clone();
    u.pathname = "/admin/login";
    return NextResponse.rewrite(u); // ยูสเซอร์จะเห็น URL เดิมที่เป็น Key แต่ระบบหลังบ้านจะดึงหน้า /admin/login มาแสดง
  }

  // 2) ถ้าพยายามเข้า /admin ตรงๆ (ยกเว้น API)
  if (pathname.startsWith("/admin")) {
    // กฎเหล็ก: ห้ามเข้าหน้า Login ผ่าน path /admin/login โดยเด็ดขาด
    if (pathname === "/admin/login") {
      return NextResponse.rewrite(new URL("/404", req.url)); // หลอกว่าไม่มีหน้านี้
    }

    // ตรวจสอบ Token สำหรับหน้า Admin อื่นๆ
    const token = req.cookies.get("admin_token")?.value || "";
    if (!token) {
      const u = url.clone();
      u.pathname = KEY ? `/${KEY}/login` : "/404"; // ถ้าไม่มี Token ให้ไล่กลับไปหน้า Secret Login หรือ 404
      u.searchParams.set("next", pathname);
      return NextResponse.redirect(u);
    }
  }

  return NextResponse.next();
}
