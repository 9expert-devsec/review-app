import ReviewEditClient from "./ReviewEditClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params; // ✅ Next 16 compatible (ถ้าไม่ใช่ Promise ก็ไม่พัง)
  return <ReviewEditClient id={p?.id || ""} />;
}
