export type OcrMode = "scan" | "photo" | "digital";

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function otsuThreshold(hist: Uint32Array, total: number) {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let max = 0;
  let thresh = 128;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      thresh = t;
    }
  }
  return thresh;
}

function unsharpGray(d: Uint8ClampedArray, w: number, h: number, amount: number) {
  const copy = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      let s = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          s += copy[((y + dy) * w + x + dx) * 4];
        }
      }
      const blur = s / 9;
      const g = copy[i];
      const out = Math.max(0, Math.min(255, g + amount * (g - blur)));
      d[i] = d[i + 1] = d[i + 2] = out;
    }
  }
}

/** Trim white page margins so pixels go to ink — PDFs only, not phone photos. */
export function cropToInk(canvas: HTMLCanvasElement, pad = 0.018): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { width: w, height: h } = canvas;
  if (w < 80 || h < 80) return canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (luminance(d[i], d[i + 1], d[i + 2]) < 242) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return canvas;
  const px = Math.round(w * pad);
  const py = Math.round(h * pad);
  minX = Math.max(0, minX - px);
  minY = Math.max(0, minY - py);
  maxX = Math.min(w - 1, maxX + px);
  maxY = Math.min(h - 1, maxY + py);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  if (cw > w * 0.97 && ch > h * 0.97) return canvas;
  if (cw < w * 0.45 || ch < h * 0.4) return canvas;
  const next = document.createElement("canvas");
  next.width = cw;
  next.height = ch;
  const nctx = next.getContext("2d");
  if (!nctx) return canvas;
  nctx.fillStyle = "#fff";
  nctx.fillRect(0, 0, cw, ch);
  nctx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return next;
}

export function sliceVertical(
  src: HTMLCanvasElement,
  y0: number,
  y1: number,
): HTMLCanvasElement {
  const y = Math.max(0, Math.floor(src.height * y0));
  const yEnd = Math.min(src.height, Math.floor(src.height * y1));
  const h = Math.max(24, yEnd - y);
  const next = document.createElement("canvas");
  next.width = src.width;
  next.height = h;
  const ctx = next.getContext("2d");
  if (!ctx) return src;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, next.width, h);
  ctx.drawImage(src, 0, y, src.width, h, 0, 0, src.width, h);
  return next;
}

/**
 * scan: Otsu + unsharp for photographed/scanned pages.
 * photo: stretch + unsharp, no hard binary (shadows would eat the text).
 * digital: leave the PDF raster alone — binarizing kills anti-aliased type.
 */
export function enhanceForOcr(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: OcrMode = "scan",
) {
  if (mode === "digital") return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let min = 255;
  let max = 0;
  const samples: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    const g = luminance(d[i], d[i + 1], d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = g;
    if (g < min) min = g;
    if (g > max) max = g;
    if ((i / 4) % 11 === 0) samples.push(g);
  }
  let lo = min;
  let hi = max;
  if (mode === "photo" && samples.length > 20) {
    const sorted = [...samples].sort((a, b) => a - b);
    lo = sorted[Math.floor(sorted.length * 0.02)] ?? min;
    hi = sorted[Math.floor(sorted.length * 0.98)] ?? max;
  }
  const span = Math.max(8, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.max(0, Math.min(255, ((d[i] - lo) / span) * 255));
    d[i] = d[i + 1] = d[i + 2] = g;
    d[i + 3] = 255;
  }
  unsharpGray(d, w, h, mode === "scan" ? 0.85 : 0.55);
  if (mode === "scan") {
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      hist[Math.max(0, Math.min(255, Math.round(d[i])))] += 1;
    }
    const thresh = otsuThreshold(hist, w * h);
    const soft = 16;
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i];
      let out: number;
      if (g > thresh + soft) out = 255;
      else if (g < thresh - soft) out = 0;
      else out = Math.round(((g - (thresh - soft)) / (soft * 2)) * 255);
      d[i] = d[i + 1] = d[i + 2] = out;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality = 0.84,
  maxChars = 620_000,
): string {
  let q = quality;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length > maxChars && q > 0.5) {
    q -= 0.08;
    out = canvas.toDataURL("image/jpeg", q);
  }
  if (out.length <= maxChars) return out;
  const next = document.createElement("canvas");
  next.width = Math.max(640, Math.round(canvas.width * 0.82));
  next.height = Math.max(640, Math.round(canvas.height * 0.82));
  const ctx = next.getContext("2d");
  if (!ctx) return out;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, next.width, next.height);
  ctx.drawImage(canvas, 0, 0, next.width, next.height);
  return next.toDataURL("image/jpeg", 0.78);
}

export function canvasToOcrJpeg(
  canvas: HTMLCanvasElement,
  mode: OcrMode,
  opts?: { crop?: boolean; quality?: number },
): string {
  const prepared = opts?.crop === false ? canvas : cropToInk(canvas);
  const ctx = prepared.getContext("2d", { willReadFrequently: true });
  if (ctx) enhanceForOcr(ctx, prepared.width, prepared.height, mode);
  const quality = opts?.quality ?? (mode === "scan" ? 0.88 : 0.82);
  return canvasToJpeg(prepared, quality, 620_000);
}

export async function fileToJpeg(file: File, max = 1600): Promise<string> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = data;
  });
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return data;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToOcrJpeg(canvas, "photo", { crop: false, quality: 0.86 });
}
