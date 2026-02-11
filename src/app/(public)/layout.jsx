import PublicNavClient from "@/components/public/PublicNavClient";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavClient />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
