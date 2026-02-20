// src/app/api/upload/review-avatar/route.js
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function ensureCloudinary() {
  cloudinary.config({
    cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

function uploadBuffer(buffer, opts) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

export async function POST(req) {
  try {
    ensureCloudinary();

    const fd = await req.formData();
    const file = fd.get("file");
    if (!file || typeof file === "string") return jsonError("Missing file");

    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const up = await uploadBuffer(buffer, {
      folder: "review-app/avatars",
      resource_type: "image",
    });

    const publicId = up.public_id;

    // ✅ FULL (คงขนาดเดิม เช่น 800x800) แค่ optimize format/quality
    const fullUrl = cloudinary.url(publicId, {
      secure: true,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    // (ถ้าจะใช้ thumb เฉพาะตอนแสดงผล ค่อยสร้างภายหลัง หรือจะส่งกลับไปด้วยก็ได้)
    // const thumb96 = cloudinary.url(publicId, {
    //   secure: true,
    //   transformation: [
    //     { width: 96, height: 96, crop: "fill", gravity: "auto" },
    //     { quality: "auto", fetch_format: "auto" },
    //   ],
    // });

    return NextResponse.json({
      ok: true,
      url: fullUrl,
      publicId,
      width: up.width,
      height: up.height,
    });
  } catch (e) {
    return jsonError(e?.message || "Upload failed", 500);
  }
}
