"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Star,
  FileDown,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Lightbulb,
} from "lucide-react";

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
const NAV_ICONS = {
  dashboard: LayoutDashboard,
  reviews: Star,
  reports: FileDown,
};

function Icon({ name, active }) {
  const Glyph = NAV_ICONS[name] || LayoutDashboard;
  return (
    <div
      className={cx(
        "grid size-9 shrink-0 place-items-center rounded-xl border transition-all",
        active
          ? "border-white/25 bg-white/15 text-white"
          : "border-slate-200 bg-white text-brand-blue shadow-sm group-hover:border-(--brand-sky)/40",
      )}
    >
      <Glyph className="size-4.5" strokeWidth={2.2} />
    </div>
  );
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
    <div className="flex min-h-dvh bg-brand-ice text-brand-navy selection:bg-brand-blue selection:text-white">
      {/* Mobile Topbar */}
      <div className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
            className="btn-ghost min-h-10! px-3!"
          >
            <Menu className="size-4.5" />
            <span className="text-sm">เมนู</span>
          </button>

          <div className="flex items-baseline gap-1 text-sm font-extrabold tracking-tight">
            <span className="text-brand-blue-bright">9Expert</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-700">{title}</span>
          </div>

          <button
            onClick={logout}
            aria-label="ออกจากระบบ"
            className="btn-danger min-h-10! px-3!"
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-(--brand-navy)/40 backdrop-blur-sm md:hidden"
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
          <div className="flex h-full flex-col border-r border-slate-200/70 bg-white">
            {/* Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-brand-blue-bright text-base font-black text-white shadow-(--shadow-soft)">
                  9
                </div>
                <div>
                  <div className="text-lg font-black leading-none tracking-tight text-brand-navy">
                    9<span className="text-brand-blue-bright">Expert</span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Review System
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 md:hidden"
              >
                <X className="size-4.5" />
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
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
                        active
                          ? "bg-brand-blue-bright text-white shadow-(--shadow-soft)"
                          : "text-slate-700 hover:bg-brand-ice",
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
                            active ? "text-white/70" : "text-slate-400",
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
              <div className="mt-8 rounded-2xl border border-(--brand-sky)/20 bg-(--brand-sky)/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-navy">
                  <Lightbulb className="size-4 text-brand-blue" />
                  Help Tip
                </div>
                <div className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
                  คุณสามารถจัดการข้อมูลการรีวิวและดูรายงานสรุปผลได้ทันทีผ่านเมนูซ้ายมือ
                </div>
              </div>
            </nav>

            {/* Logout & Footer */}
            <div className="mt-auto border-t border-slate-200/70 bg-brand-ice p-4">
              <button
                onClick={logout}
                className="btn-danger group w-full py-3!"
              >
                <LogOut className="size-4" />
                Logout System
              </button>
              <div className="mt-3 text-center text-[10px] font-bold tracking-wider text-slate-400">
                © {new Date().getFullYear()} 9EXPERT REVIEW SYSTEM
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {/* Desktop Topbar */}
          <header className="sticky top-0 z-30 hidden w-full border-b border-slate-200/70 bg-white/85 backdrop-blur md:block">
            <div className="flex items-center justify-between px-8 py-5">
              <div>
                <div className="text-xl font-extrabold tracking-tight text-brand-navy">
                  {title}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-emerald-700">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Admin Session Active
                  </span>
                  <span className="font-mono text-[10px] tracking-tight text-slate-400">
                    {pathname}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="btn-ghost text-xs!"
                >
                  <ExternalLink className="size-4" />
                  View Website
                </Link>
                <button onClick={logout} className="btn-danger text-xs!">
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Slot */}
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10">
            <div className="mx-auto max-w-6xl">
              <div className="min-h-[calc(100vh-12rem)] rounded-3xl border border-slate-200/70 bg-white p-5 shadow-(--shadow-soft-lg) transition-all md:p-8 lg:p-10">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
