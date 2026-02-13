// src/lib/imageCompress.client.js
export async function compressImageFile(
  file,
  {
    maxSize = 1024, // px
    quality = 0.82,
    mimeType = "image/webp", // หรือ "image/jpeg"
  } = {},
) {
  if (!file || !file.type?.startsWith("image/")) return file;

  const srcUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = srcUrl;
    });

    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (!w || !h) return file;

    const scale = Math.min(1, maxSize / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, tw, th);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality),
    );
    if (!blob) return file;

    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/jpeg"
          ? "jpg"
          : "webp";
    const name = (file.name || "avatar").replace(/\.[a-z0-9]+$/i, "");
    return new File([blob], `${name}.${ext}`, { type: mimeType });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}
