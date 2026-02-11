import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-[#0d1a29] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* top */}
        <div className="grid gap-10 md:grid-cols-3">
          {/* col 1 */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="w-28 rounded-full bg-white px-3 ring-1 ring-white/10 mb-3">
                <img
                  src="https://res.cloudinary.com/ddva7xvdt/image/upload/v1770714090/logo-9experttraining-color_dtrifk.png"
                  alt="9Expert Training"
                  className="h-auto w-full"
                />
              </div>
            </div>

            <div className="text-sm leading-6 text-white/70">
              สถาบันฝึกอบรมด้านเทคโนโลยีชั้นนำของประเทศไทย
              <br />
              ผู้เชี่ยวชาญด้าน Microsoft Power Platform, AI &amp; Data Analytics
            </div>
          </div>

          {/* col 2 */}
          <div className="md:justify-self-center">
            <div className="text-sm font-semibold text-white/90">ลิงก์</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <Link
                className="block hover:text-white"
                href="https://www.9experttraining.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                เว็บไซต์หลัก
              </Link>
              <Link
                className="block hover:text-white"
                href="https://www.9experttraining.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </div>
          </div>

          {/* col 3 */}
          <div className="md:justify-self-end">
            <div className="text-sm font-semibold text-white/90">ติดตามเรา</div>

            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/9expert_training"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>

              {/* TikTok - ใช้ SVG */}
              <a
                href="https://www.tiktok.com/@9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.21-.15-.4-.31-.59-.47-.05 3.87.02 7.74-.02 11.61-.05 1.5-.47 3.01-1.41 4.19-1.37 1.83-3.81 2.73-6.04 2.45-2.07-.22-4.04-1.57-4.9-3.51-.88-1.92-.67-4.38.64-6.1a6.07 6.07 0 0 1 4.02-2.31c.01 1.44.01 2.89.01 4.33-.87.15-1.74.57-2.28 1.3-.64.84-.71 2.06-.21 2.99.51.98 1.62 1.59 2.7 1.58 1.18-.01 2.21-.86 2.5-2.01.21-.73.19-1.5.19-2.25V0h-.01z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Linkedin className="h-5 w-5 text-white" />
              </a>

              <a
                href="https://www.youtube.com/@9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Youtube className="h-5 w-5 text-white" />
              </a>

              {/* Shopee / Store */}
              <a
                href="https://shopee.co.th/9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <svg
                  className="h-5 w-5 fill-none stroke-white"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2026 9Expert Training (บริษัท นายน์เอ็กซ์เพิร์ท จำกัด). All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
