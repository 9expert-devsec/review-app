import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { requireAdmin } from "@/lib/adminAuth.server";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}
function joinUrl(base, path) {
  const b = clean(base).replace(/\/+$/, "");
  const p = clean(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

// ปรับตัวนี้ได้ถ้า upstream field ไม่ตรง
function pickName(it) {
  return (
    clean(it?.name) ||
    clean(it?.title) ||
    clean(it?.course_name) ||
    clean(it?.courseName) ||
    clean(it?.public_course_name) ||
    ""
  );
}
function pickSourceId(it) {
  return (
    clean(it?._id) ||
    clean(it?.id) ||
    clean(it?.courseId) ||
    clean(it?.slug) ||
    ""
  );
}
function extractItems(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

export async function POST() {
  try {
    await requireAdmin();
    await dbConnect();

    const base =
      clean(process.env.AI_BASE_URL) || "https://9exp-sec.com/api/ai";
    const url = joinUrl(base, "/public-course");

    const headers = { accept: "application/json" };
    const key = clean(process.env.AI_API_KEY); // เผื่อมี key (ถ้าไม่มีก็ไม่เป็นไร)
    if (key) {
      headers["x-ai-api-key"] = key;
      headers["x-api-key"] = key;
      headers["authorization"] = `Bearer ${key}`;
    }

    const res = await fetch(url, { headers, cache: "no-store" });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Upstream error",
          status: res.status,
          hint: json || null,
        },
        { status: 502 },
      );
    }

    const raw = extractItems(json);
    const now = new Date();

    const mapped = raw
      .map((it, idx) => {
        const name = pickName(it);
        if (!name) return null;
        const sourceId = pickSourceId(it);
        return {
          name,
          sourceId,
          sortOrder: idx + 1,
          isActive: true,
          syncedAt: now,
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No courses parsed from upstream" },
        { status: 400 },
      );
    }

    const ops = mapped.map((c) => {
      const filter = c.sourceId ? { sourceId: c.sourceId } : { name: c.name };
      return {
        updateOne: {
          filter,
          update: { $set: c },
          upsert: true,
        },
      };
    });

    const r = await Course.bulkWrite(ops, { ordered: false });

    return NextResponse.json({
      ok: true,
      upstreamCount: raw.length,
      parsedCount: mapped.length,
      upserted: r.upsertedCount || 0,
      modified: r.modifiedCount || 0,
    });
  } catch (e) {
    const msg = String(e?.message || "");
    const status = msg.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: msg || "Sync failed" },
      { status },
    );
  }
}
