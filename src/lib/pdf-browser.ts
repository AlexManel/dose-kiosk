import { getDocument, GlobalWorkerOptions, type PDFPageProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  canvasToJpeg,
  cropToInk,
  enhanceForOcr,
  sliceVertical,
  type OcrMode,
} from "@/lib/image";
import { isScannedPdfText } from "@/lib/invoice-parse";

GlobalWorkerOptions.workerSrc = workerUrl;

type TextMark = { str: string; x: number; y: number; w: number; h: number; eol: boolean };

function linesFromItems(items: TextMark[]) {
  if (!items.length) return [];
  const heights = items
    .map((i) => i.h)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)] || 10;
  const tol = Math.max(2.2, medianH * 0.48);

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: TextMark[][] = [];
  for (const item of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].y - item.y) <= tol && !last[last.length - 1]?.eol) {
      last.push(item);
    } else {
      rows.push([item]);
    }
  }
  return rows
    .map((row) => {
      const ordered = row.sort((a, b) => a.x - b.x);
      let line = "";
      let prev: TextMark | null = null;
      for (const t of ordered) {
        if (!prev) {
          line = t.str;
          prev = t;
          continue;
        }
        const gap = t.x - (prev.x + prev.w);
        if (gap > Math.max(3.2, medianH * 0.55)) line += "  ";
        else if (!line.endsWith(" ") && !t.str.startsWith(" ")) line += " ";
        line += t.str;
        prev = t;
      }
      return line.replace(/[ \t]{3,}/g, "  ").trim();
    })
    .filter(Boolean);
}

async function rasterPage(page: PDFPageProxy, targetPx: number) {
  const base = page.getViewport({ scale: 1 });
  const scale = targetPx / Math.max(base.width, base.height);
  const viewport = page.getViewport({
    scale: Math.min(3.8, Math.max(1.2, scale)),
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({
    canvasContext: ctx,
    canvas,
    viewport,
    background: "#ffffff",
  }).promise;
  return canvas;
}

function encodePage(raw: HTMLCanvasElement, mode: OcrMode): {
  full: string;
  header: string;
  table: string;
} {
  const cropped = cropToInk(raw);
  const ctx = cropped.getContext("2d", { willReadFrequently: true });
  if (ctx) enhanceForOcr(ctx, cropped.width, cropped.height, mode);
  const quality = mode === "scan" ? 0.88 : 0.8;
  const full = canvasToJpeg(cropped, quality, 620_000);
  if (mode === "digital") {
    return { full, header: "", table: "" };
  }
  const header = canvasToJpeg(sliceVertical(cropped, 0, 0.36), 0.88, 520_000);
  const table = canvasToJpeg(sliceVertical(cropped, 0.2, 0.97), 0.88, 620_000);
  return { full, header, table };
}

function pickImages(
  pages: { full: string; header: string; table: string }[],
  scanned: boolean,
): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    if (s && out.length < 4) out.push(s);
  };
  if (!scanned) {
    for (const p of pages.slice(0, 2)) push(p.full);
    return out;
  }
  if (pages.length === 1) {
    push(pages[0].full);
    push(pages[0].header);
    push(pages[0].table);
    return out;
  }
  push(pages[0].full);
  push(pages[0].table);
  for (const p of pages.slice(1)) push(p.full);
  return out;
}

export async function extractPdf(file: File): Promise<{
  text: string;
  image: string;
  images: string[];
  pageCount: number;
  scanned: boolean;
}> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await getDocument({ data }).promise;
  const pageCount = doc.numPages;
  const textPages = Math.min(pageCount, 12);
  const allLines: string[] = [];

  for (let i = 1; i <= textPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const marks: TextMark[] = [];
    for (const raw of content.items) {
      if (!raw || typeof raw !== "object" || !("str" in raw)) continue;
      const item = raw as {
        str: string;
        transform: number[];
        width?: number;
        height?: number;
        hasEOL?: boolean;
      };
      if (!item.str.trim()) continue;
      const h = item.height ?? Math.abs(item.transform[0] ?? 10);
      marks.push({
        str: item.str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        w: item.width ?? Math.max(h * 0.5, Math.abs(item.transform[0] ?? 6) * 0.5),
        h,
        eol: Boolean(item.hasEOL),
      });
    }
    const lines = linesFromItems(marks);
    if (lines.length) allLines.push(`--- σελίδα ${i} ---`, ...lines);
  }

  const text = allLines.join("\n").slice(0, 18_000);
  const scanned = isScannedPdfText(text, pageCount);
  const renderCount = Math.min(pageCount, scanned ? 3 : 2);
  const targetPx = scanned ? 2000 : 1400;
  const mode: OcrMode = scanned ? "scan" : "digital";
  const pages: { full: string; header: string; table: string }[] = [];

  for (let i = 1; i <= renderCount; i += 1) {
    const page = await doc.getPage(i);
    const canvas = await rasterPage(page, targetPx);
    if (!canvas) continue;
    pages.push(encodePage(canvas, mode));
  }

  const images = pickImages(pages, scanned);
  return {
    text,
    image: images[0] ?? "",
    images,
    pageCount,
    scanned,
  };
}
