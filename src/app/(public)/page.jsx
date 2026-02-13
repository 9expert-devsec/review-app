// src/app/(public)/page.jsx
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowDown,
  ArrowRight,
  Star,
  Wrench,
  Users,
  Activity,
} from "lucide-react";
import TestimonialCarouselClient from "./TestimonialCarouselClient";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host");
  return `${proto}://${host}`;
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-slate-200 bg-white p-8",
        "shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        "transition-transform transition-shadow duration-200",
        "hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]",
      )}
    >
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        {icon}
      </div>
      <div className="text-lg font-semibold text-[#0D1B2A]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

export default async function HomePage() {
  // ✅ ดึงรีวิว active ทั้งหมด (ตาม displayOrder)
  let reviews = [];
  try {
    const baseUrl = await getBaseUrl();
    const r = await fetch(`${baseUrl}/api/public/reviews?limit=50`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (j?.ok) reviews = j.items || [];
  } catch {
    reviews = [];
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-white h-screen items-center justify-center flex">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            เปิดรับรีวิวจากผู้เรียน 9Expert
          </div>

          <h1 className="mt-10 text-5xl font-bold leading-[1.1] tracking-tight text-[#0D1B2A] md:text-6xl">
            แบ่งปัน{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              เรื่องราว
            </span>
            <br />
            ความสำเร็จของคุณ
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            ความคิดเห็นของคุณมีความหมาย ช่วยให้เราพัฒนาหลักสูตร
            <br className="hidden md:block" />
            และเป็นแรงบันดาลใจให้ผู้เรียนรุ่นต่อไป
          </p>

          <div className="mt-10 flex items-center justify-center">
            <Link
              href="/review"
              className={cx(
                "inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4",
                "bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold",
                "shadow-[0_18px_40px_rgba(37,99,235,0.35)]",
                "hover:brightness-110 active:scale-[0.99] transition",
              )}
            >
              เขียนรีวิวของคุณ
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* <div className="mt-10 flex justify-center">
            <a
              href="#why"
              className="mt-10 inline-flex flex-col items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition"
            >
              <span>เลื่อนลง</span>
              <ArrowDown className="h-4 w-4 animate-floatY" />
            </a>
          </div> */}
        </div>
      </section>

      {/* Why share */}
      {/* <section
        id="why"
        className="w-full bg-[#f7f9fc] py-20 border-t border-slate-200/0"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-blue-600">
              WHY SHARE?
            </div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0D1B2A]">
              ทำไมต้องแบ่งปันประสบการณ์?
            </h2>
            <p className="mt-4 text-slate-600">
              ทุกเสียงของคุณสร้างความเปลี่ยนแปลงที่ยิ่งใหญ่
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Star className="h-6 w-6 text-blue-600" />}
              title="สร้างแรงบันดาลใจ"
              desc="เรื่องราวของคุณเป็นแรงบันดาลใจให้ผู้เรียนรุ่นต่อไปก้าวสู่ความสำเร็จ"
            />
            <FeatureCard
              icon={<Wrench className="h-6 w-6 text-blue-600" />}
              title="ช่วยเราพัฒนา"
              desc="ความเห็นของคุณช่วยให้เราปรับปรุงหลักสูตรให้ตรงกับความต้องการมากขึ้น"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-blue-600" />}
              title="เป็นส่วนหนึ่งของชุมชน"
              desc="ร่วมเป็นส่วนหนึ่งของชุมชนแห่งการเรียนรู้และเติบโตไปด้วยกัน"
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6 text-blue-600" />}
              title="สร้างความแตกต่าง"
              desc="ทุกรีวิวมีพลังในการช่วยให้ผู้อื่นตัดสินใจเลือกเส้นทางการพัฒนาทักษะ"
            />
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      <section className="w-full bg-white pt-20 pb-20 border-t border-slate-200/0">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-blue-600">
              TESTIMONIALS
            </div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0D1B2A]">
              เสียงจากผู้เรียนของเรา
            </h2>
            <p className="mt-4 text-slate-600">
              ประสบการณ์จริงจากผู้เรียนที่ประสบความสำเร็จ
            </p>
          </div>

          {/* ✅ เปลี่ยนจาก grid static เป็น carousel */}
          <TestimonialCarouselClient items={reviews} />

          <div className="mt-14 flex justify-center">
            <Link
              href="/review"
              className={cx(
                "inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4",
                "bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold",
                "shadow-[0_18px_40px_rgba(37,99,235,0.35)]",
                "hover:brightness-110 active:scale-[0.99] transition",
              )}
            >
              แบ่งปันเรื่องราวของคุณ
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
