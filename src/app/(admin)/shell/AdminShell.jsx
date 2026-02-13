"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Utility สำหรับรวม Class Tailwind
function cx(...a) {
  return a.filter(Boolean).join(" ");
}

// เช็คว่าเมนูไหนกำลังทำงานอยู่
function isActivePath(pathname, href) {
  if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// กำหนดหัวข้อหน้าตามเส้นทาง
function pageTitleFromPath(pathname) {
  if (pathname.startsWith("/admin/reviews")) return "Reviews";
  if (pathname.startsWith("/admin/reports")) return "Reports";
  return "Dashboard";
}

// ส่วนแสดง Icon เมนู
function Icon({ name, active }) {
  const base = cx(
    "grid place-items-center rounded-xl border text-xs font-semibold transition-all",
    active
      ? "border-white/20 bg-white/10 text-white shadow-inner"
      : "border-slate-200 bg-white text-slate-700 shadow-sm",
  );

  const glyph =
    name === "dashboard"
      ? "⌁"
      : name === "reviews"
        ? "★"
        : name === "reports"
          ? "⇩"
          : "•";

  return <div className={cx("size-9", base)}>{glyph}</div>;
}

export default function AdminShell({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ข้อมูลเมนู Navigation
  const nav = useMemo(
    () => [
      {
        href: "/admin/dashboard",
        key: "dashboard",
        label: "Dashboard",
        desc: "สถิติและภาพรวม",
      },
      {
        href: "/admin/reviews",
        key: "reviews",
        label: "Reviews",
        desc: "จัดการรีวิวทั้งหมด",
      },
      {
        href: "/admin/reports",
        key: "reports",
        label: "Reports",
        desc: "Export CSV/Report",
      },
    ],
    [],
  );

  const title = pageTitleFromPath(pathname);

  // Logout: ให้ server clear cookie + คืน redirectTo
  async function logout() {
    try {
      const r = await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      let data = null;
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await r.json().catch(() => null);
      }

      const to = data?.redirectTo || "/";
      router.replace(to);
      router.refresh();
      return;
    } catch (err) {
      console.error("Logout error", err);
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Mobile Topbar */}
      <div className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-medium transition-all hover:bg-slate-50 active:scale-95"
          >
            ☰ เมนู
          </button>

          <div className="text-sm font-bold tracking-tight">{title}</div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="relative mx-auto flex w-full max-w-[1440px]">
        {/* Sidebar */}
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-50 w-[288px] transition-transform duration-300 ease-in-out md:sticky md:z-0 md:translate-x-0",
            open ? "translate-x-0 shadow-2xl" : "-translate-x-full md:block",
          )}
        >
          <div className="flex h-full flex-col border-r bg-white">
            {/* Brand Header */}
            <div className="flex items-center justify-between border-b px-5 py-5">
              <div>
                <div className="text-xl font-black tracking-tighter text-slate-900">
                  ADMIN <span className="text-slate-400">PANEL</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Management Console
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50 md:hidden"
              >
                ✕
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Main Navigation
              </div>

              <div className="space-y-1.5">
                {nav.map((it) => {
                  const active = isActivePath(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={cx(
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200",
                        active
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "text-slate-700 hover:translate-x-1 hover:bg-slate-100",
                      )}
                    >
                      <Icon name={it.key} active={active} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {it.label}
                        </div>
                        <div
                          className={cx(
                            "mt-0.5 text-[11px] font-medium leading-none",
                            active ? "text-white/60" : "text-slate-400",
                          )}
                        >
                          {it.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Tips Section */}
              <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="text-amber-500">💡</span> Help Tip
                </div>
                <div className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
                  คุณสามารถจัดการข้อมูลการรีวิวและดูรายงานสรุปผลได้ทันทีผ่านเมนูซ้ายมือ
                </div>
              </div>
            </nav>

            {/* Logout & Footer */}
            <div className="mt-auto border-t bg-slate-50/30 p-4">
              <button
                onClick={logout}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-all hover:bg-red-100 active:scale-[0.98]"
              >
                Logout System
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
              <div className="mt-3 text-center text-[10px] font-bold tracking-wider text-slate-400">
                © {new Date().getFullYear()} REVIEW SYSTEM V2
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {/* Desktop Topbar */}
          <header className="sticky top-0 z-30 hidden w-full border-b bg-white/80 backdrop-blur md:block">
            <div className="flex items-center justify-between px-8 py-5">
              <div>
                <div className="text-xl font-extrabold tracking-tight text-slate-900">
                  {title}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <div className="text-[10px] font-mono uppercase tracking-tight text-slate-400">
                    Admin Session Active • {pathname}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                >
                  View Website ↗
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-all hover:bg-red-100 active:scale-95"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Slot */}
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10">
            <div className="mx-auto max-w-6xl">
              <div className="min-h-[calc(100vh-12rem)] rounded-[2.5rem] border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all md:p-10">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
