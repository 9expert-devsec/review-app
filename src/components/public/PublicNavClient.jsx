"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function PublicNavClient() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isReview = pathname.startsWith("/review");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/ddva7xvdt/image/upload/v1770714090/logo-9experttraining-color_dtrifk.png"
              alt="9Expert Training"
              className="h-16 w-auto"
            />
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                isHome
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              หน้าแรก
            </Link>
            <Link
              href="/review"
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                isReview
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              เขียนรีวิว
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
