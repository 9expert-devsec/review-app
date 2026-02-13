import Link from "next/link";
import Image from "next/image";
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
                <Image
                  src="/instagram.svg"
                  alt="Instagram"
                  width={20}
                  height={20}
                />
              </a>

              {/* TikTok - ใช้ SVG */}
              <a
                href="https://www.tiktok.com/@9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Image src="/tiktok.svg" alt="TikTok" width={20} height={20} />
              </a>

              <a
                href="https://www.linkedin.com/company/9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Image
                  src="/linked-in.svg"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                />
              </a>

              <a
                href="https://www.youtube.com/@9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Image
                  src="/youtube.svg"
                  alt="YouTube"
                  width={20}
                  height={20}
                />
              </a>

              {/* Shopee / Store */}
              <a
                href="https://shopee.co.th/9expert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20 hover:ring-white/30"
              >
                <Image src="/shopee.svg" alt="Shopee" width={20} height={20} />
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
