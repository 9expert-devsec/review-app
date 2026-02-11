import "./globals.css";
import { Inter, Noto_Sans_Thai } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-thai",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${inter.variable} ${notoThai.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
