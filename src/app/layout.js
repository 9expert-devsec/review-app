import "./globals.css";
import localFont from "next/font/local";

// Body font — Google Sans (.ttf), mapped to --font-body
const googleSans = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../fonts/GoogleSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/GoogleSans-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/GoogleSans-Medium.ttf", weight: "500", style: "normal" },
    {
      path: "../fonts/GoogleSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/GoogleSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/GoogleSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    { path: "../fonts/GoogleSans-Bold.ttf", weight: "700", style: "normal" },
    {
      path: "../fonts/GoogleSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
});

// Heading font — LINE Seed Sans TH (.woff2), mapped to --font-heading
const lineSeedTH = localFont({
  variable: "--font-heading",
  display: "swap",
  src: [
    { path: "../fonts/LINESeedSansTH_W_Th.woff2", weight: "300", style: "normal" },
    { path: "../fonts/LINESeedSansTH_W_Rg.woff2", weight: "400", style: "normal" },
    { path: "../fonts/LINESeedSansTH_W_Bd.woff2", weight: "700", style: "normal" },
    { path: "../fonts/LINESeedSansTH_W_XBd.woff2", weight: "800", style: "normal" },
    { path: "../fonts/LINESeedSansTH_W_He.woff2", weight: "900", style: "normal" },
  ],
});

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${googleSans.variable} ${lineSeedTH.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
