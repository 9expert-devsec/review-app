// src/app/api/upload/review-avatar/route.js
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif", // ถ้าไม่อยากรับ GIF ลบออกได้
]);

function clean(x) {
  return String(x || "").trim();
}

function ensureCloudinaryEnv() {
  const cloud_name = clean(process.env.CLOUDINARY_CLOUD_NAME);
  const api_key = clean(process.env.CLOUDINARY_API_KEY);
  const api_secret = clean(process.env.CLOUDINARY_API_SECRET);
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Missing Cloudinary env (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)",
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
}

function uploadBufferToCloudinary(buf, opts) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buf);
  });
}

export async function POST(req) {
  try {
    ensureCloudinaryEnv();

    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    // file เป็น Blob ใน Next route handler
    const mime = clean(file.type);
    const size = Number(file.size || 0);

    if (!mime || !ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { ok: false, error: "Invalid file type (allowed: jpg/png/webp/gif)" },
        { status: 400 },
      );
    }

    // เช็คขนาดก่อนอ่าน buffer
    if (size && size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const up = await uploadBufferToCloudinary(buf, {
      folder: "review-app/avatars",
      resource_type: "image",
      // ให้ Cloudinary optimize อัตโนมัติ (ไม่ crop)
      transformation: [
        { width: 1024, height: 1024, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      ok: true,
      url: up.secure_url,
      publicId: up.public_id,
      bytes: up.bytes,
      format: up.format,
      width: up.width,
      height: up.height,
    });
  } catch (e) {
    const msg = String(e?.message || "Upload failed");

    // map error ที่พบบ่อยให้เข้าใจง่าย
    const status = msg.includes("Missing Cloudinary env")
      ? 500
      : msg.toLowerCase().includes("invalid")
        ? 400
        : 500;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
