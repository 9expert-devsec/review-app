import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
