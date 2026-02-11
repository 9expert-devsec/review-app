"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function SiteHeader() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "หน้าแรก" },
    { href: "/write", label: "เขียนรีวิว" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100" />
          <div className="font-semibold">9Expert Training</div>
        </div>

        <nav className="flex items-center gap-3">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-medium",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
