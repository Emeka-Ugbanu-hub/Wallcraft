export type ExportVariant = "mobile-4k" | "desktop-4k" | "square-4k";
export type ExportQuality = "lossless" | "high" | "balanced";

export const EXPORT_PRESETS: Record<
  ExportVariant,
  { label: string; width: number; height: number; ratio: number }
> = {
  "mobile-4k": { label: "Mobile 4K", width: 2160, height: 3840, ratio: 9 / 19.5 },
  "desktop-4k": { label: "Desktop 4K", width: 3840, height: 2160, ratio: 16 / 10 },
  "square-4k": { label: "Square 4K", width: 3840, height: 3840, ratio: 1 },
};

export const QUALITY_OPTIONS: Record<
  ExportQuality,
  { label: string; pngQuality: number; jpegQuality: number }
> = {
  lossless: { label: "Lossless", pngQuality: 1, jpegQuality: 1 },
  high: { label: "High", pngQuality: 1, jpegQuality: 0.92 },
  balanced: { label: "Balanced", pngQuality: 1, jpegQuality: 0.8 },
};

export type LastExportInfo = {
  variant: ExportVariant;
  quality: ExportQuality;
  width: number;
  height: number;
  timestamp: number;
  formatLabel: string;
};

export function formatLastExport(info: LastExportInfo): string {
  const date = new Date(info.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${info.width}x${info.height} · ${info.formatLabel} · ${timeStr}`;
}

export function computePixelRatio(
  canvasWidth: number,
  canvasHeight: number,
  targetWidth: number,
): number {
  return targetWidth / canvasWidth;
}

export function nearestVariant(
  width: number,
  height: number,
): ExportVariant {
  const ratio = width / height;
  const landscapes = Math.abs(ratio - EXPORT_PRESETS["desktop-4k"].ratio);
  const portraits = Math.abs(ratio - EXPORT_PRESETS["mobile-4k"].ratio);
  const squares = Math.abs(ratio - EXPORT_PRESETS["square-4k"].ratio);
  const min = Math.min(landscapes, portraits, squares);
  if (min === landscapes) return "desktop-4k";
  if (min === portraits) return "mobile-4k";
  return "square-4k";
}
