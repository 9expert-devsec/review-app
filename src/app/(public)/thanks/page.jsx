// src/app/(public)/thanks/page.jsx
import Link from "next/link";
import { House, ExternalLink } from "lucide-react";
import AnimatedCheck from "@/components/icons/IconCheck";

export const dynamic = "force-dynamic";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function ThanksPage() {
  return (
    <div className="relative min-h-screen bg-[#F6F8FC]">
      {/* Soft background */}
      {/* <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div> */}

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
        {/* Icon */}
        <div>
          <AnimatedCheck size={200} className="mx-auto" />
        </div>

        {/* Headline */}
        <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl leading-14">
          ขอบคุณที่แบ่งปัน
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            ประสบการณ์ของคุณ!
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
          เราได้รับข้อมูลรีวิวของคุณเรียบร้อยแล้ว ความคิดเห็นของคุณเป็น
          <br className="hidden md:block" />
          สิ่งที่มีค่าอย่างยิ่งสำหรับเราและชุมชนผู้อบรมของ 9Expert Training
        </p>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-2xl",
              "bg-gradient-to-r from-blue-600 to-blue-400 px-7 py-4 text-sm font-bold text-white",
              "shadow-[0_18px_40px_rgba(37,99,235,0.28)]",
              "hover:bg-blue-700 transition active:scale-[0.98]",
            )}
          >
            <House className="h-5 w-5" />
            กลับสู่หน้าแรก
          </Link>

          <Link
            target="_blank"
            href="https://9experttraining.com/"
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-2xl",
              "border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-blue-600",
              "shadow-sm hover:bg-slate-50 transition active:scale-[0.98]",
            )}
          >
            ดูหลักสูตรอื่น ๆ
            <ExternalLink className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
