// src/lib/cropImage.client.js

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function toJpgName(name) {
  const n = String(name || "avatar").trim() || "avatar";
  return n.replace(/\.(png|jpg|jpeg|webp|gif|heic|heif)$/i, "") + ".jpg";
}

// cropPixels: { x, y, width, height }
// outputSize: ขนาดไฟล์ที่ได้ (แนะนำ 800)
export async function cropToSquareFile(file, cropPixels, outputSize = 800) {
  const url = URL.createObjectURL(file);
  try {
    const image = await createImage(url);

    const canvas = document.createElement("canvas");
    const out = Math.max(256, Math.min(1600, Number(outputSize) || 800));
    canvas.width = out;
    canvas.height = out;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // วาดเฉพาะส่วนที่ crop แล้ว scale เป็น out x out
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      out,
      out,
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        "image/jpeg",
        0.92, // quality
      );
    });

    if (!blob) throw new Error("Crop failed");

    return new File([blob], toJpgName(file.name), { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
