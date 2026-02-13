import { requireAdmin } from "@/lib/adminAuth.server";
import AdminShell from "@/app/(admin)/shell/AdminShell";

export const dynamic = "force-dynamic";

export default async function Layout({ children }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
