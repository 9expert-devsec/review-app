import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/adminJwt.server";

export async function requireAdmin() {
  // ✅ Next 16: cookies() ต้อง await
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || "";

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = await verifyAdminToken(token).catch(() => null);

  if (!payload || payload.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return payload;
}
