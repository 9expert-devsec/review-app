import { v2 as cloudinary } from "cloudinary";

function clean(x) {
  return String(x || "").trim();
}

const cfg = {
  cloud_name: clean(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: clean(process.env.CLOUDINARY_API_KEY),
  api_secret: clean(process.env.CLOUDINARY_API_SECRET),
};

let configured = false;

function ensureCloudinary() {
  if (configured) return;
  if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
    throw new Error("Cloudinary env missing");
  }
  cloudinary.config(cfg);
  configured = true;
}

export async function uploadBufferToCloudinary(buffer, opts = {}) {
  ensureCloudinary();

  const folder = clean(opts.folder) || "review-app";
  const public_id = clean(opts.publicId) || undefined;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type: "image",
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}
