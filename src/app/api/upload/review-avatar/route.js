import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    // limit กันพลาด (เช่น 5MB)
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "File too large" },
        { status: 400 },
      );
    }

    const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`;
    const up = await cloudinary.uploader.upload(dataUrl, {
      folder: "review-app/avatars",
      resource_type: "image",
    });

    return NextResponse.json({
      ok: true,
      url: up.secure_url,
      publicId: up.public_id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
