/**
 * Client-side image tools: background removal, recolor, and layer transforms.
 * All operations run on a canvas — no server upload required.
 */

export interface BgRemoveOptions {
  /** 0-255 tolerance for "close to background" */
  tolerance: number;
  /** sample corners to detect background color */
  sampleSize: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/** Detect the dominant background color by sampling the four corners. */
function detectBackground(ctx: CanvasRenderingContext2D, w: number, h: number, sample: number) {
  const corners: [number, number][] = [
    [0, 0],
    [w - sample, 0],
    [0, h - sample],
    [w - sample, h - sample],
  ];
  let r = 0, g = 0, b = 0, count = 0;
  for (const [x, y] of corners) {
    const data = ctx.getImageData(x, y, sample, sample).data;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
  }
  return { r: r / count, g: g / count, b: b / count };
}

/** Remove a near-uniform background (works best on product shots / logos). */
export async function removeBackground(
  src: string,
  options: BgRemoveOptions = { tolerance: 32, sampleSize: 12 }
): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0);

  const bg = detectBackground(ctx, canvas.width, canvas.height, options.sampleSize);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const tol = options.tolerance;

  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - bg.r;
    const dg = d[i + 1] - bg.g;
    const db = d[i + 2] - bg.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < tol) {
      d[i + 3] = 0;
    } else if (dist < tol * 1.6) {
      // soft edge
      d[i + 3] = Math.round(((dist - tol) / (tol * 0.6)) * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Replace one color with another (with tolerance). */
export async function replaceColor(
  src: string,
  from: string,
  to: string,
  tolerance = 40
): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0);

  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - fromRgb.r;
    const dg = d[i + 1] - fromRgb.g;
    const db = d[i + 2] - fromRgb.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < tolerance) {
      const t = 1 - dist / tolerance;
      d[i] = Math.round(d[i] + (toRgb.r - d[i]) * t);
      d[i + 1] = Math.round(d[i + 1] + (toRgb.g - d[i + 1]) * t);
      d[i + 2] = Math.round(d[i + 2] + (toRgb.b - d[i + 2]) * t);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Recolor the whole image by hue rotation (degrees). */
export async function hueRotate(src: string, degrees: number): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.filter = `hue-rotate(${degrees}deg)`;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Adjust brightness/contrast/saturation. Values are percentages (100 = neutral). */
export async function adjustImage(
  src: string,
  { brightness = 100, contrast = 100, saturate = 100 }: { brightness?: number; contrast?: number; saturate?: number }
): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Crop to a rectangle (in natural pixels). */
export async function cropImage(
  src: string,
  rect: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(Math.max(1, rect.width), Math.max(1, rect.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return canvas.toDataURL("image/png");
}

/** Flip horizontally or vertically. */
export async function flipImage(src: string, axis: "horizontal" | "vertical"): Promise<string> {
  const img = await loadImage(src);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  if (axis === "horizontal") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Resize to a max dimension, preserving aspect ratio. */
export async function resizeImage(src: string, maxSize: number): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
