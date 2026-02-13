// middleware.js (ไฟล์ที่อยู่ที่ root)
import proxy from "./src/proxy"; // Import ตัวจัดการที่เราเขียนไว้แยกต่างหาก

export function middleware(req) {
  // ส่งต่อให้ proxy.js เป็นคนจัดการ logic ทั้งหมด
  return proxy(req);
}

export const config = {
  /* เปลี่ยน matcher ใหม่: 
     ต้องให้ Middleware ทำงานทุกหน้า (ยกเว้นไฟล์ static) 
     เพื่อให้มันดักจับรหัสลับที่อยู่ต้น URL ได้
  */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};