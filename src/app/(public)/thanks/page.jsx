import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center flex flex-col min-h-[calc(100dvh-350px)]">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900">
        ขอบคุณสำหรับการรีวิว
      </h1>
      <p className="mt-4 text-slate-600">
        รีวิวของคุณมีความหมาย และช่วยให้เราพัฒนาได้ดีขึ้น
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] hover:bg-blue-700 transition"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
