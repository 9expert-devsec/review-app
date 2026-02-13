// src/lib/courseSync.server.js
import Course from "@/models/Course";

function clean(x) {
  return String(x || "").trim();
}
function joinUrl(base, path) {
  const b = clean(base).replace(/\/+$/, "");
  const p = clean(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

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

export async function syncCoursesFromUpstream() {
  const base = clean(process.env.AI_BASE_URL) || "https://9exp-sec.com/api/ai";
  const url = joinUrl(base, "/public-course");

  const headers = { accept: "application/json" };
  const key = clean(process.env.AI_API_KEY);
  if (key) {
    headers["x-ai-api-key"] = key;
    headers["x-api-key"] = key;
    headers["authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(url, { headers, cache: "no-store" });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error("Upstream error");
    err.status = 502;
    err.payload = { status: res.status, hint: json || null };
    throw err;
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
    const err = new Error("No courses parsed from upstream");
    err.status = 400;
    throw err;
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

  return {
    upstreamCount: raw.length,
    parsedCount: mapped.length,
    upserted: r.upsertedCount || 0,
    modified: r.modifiedCount || 0,
  };
}
