export type SafeZoneStatus = {
  textClipping: boolean;
  textTooSmall: boolean;
  mediaClipping: boolean;
  decorationClipping: boolean;
  warnings: string[];
};

const SAFE_MARGIN = 5;

export function checkSafeZone(
  textBox: { x: number; y: number; w: number; h: number } | null,
  mediaBox: { x: number; y: number; w: number; h: number } | null,
  decorations: Array<{ x: number; y: number; size: number }>,
  hasText: boolean,
  hasMedia: boolean,
  fontSize: number,
): SafeZoneStatus {
  const warnings: string[] = [];
  let textClipping = false;
  let textTooSmall = false;
  let mediaClipping = false;
  let decorationClipping = false;

  if (hasText && textBox) {
    if (
      textBox.x < SAFE_MARGIN ||
      textBox.y < SAFE_MARGIN ||
      textBox.x + textBox.w > 100 - SAFE_MARGIN ||
      textBox.y + textBox.h > 100 - SAFE_MARGIN
    ) {
      textClipping = true;
      warnings.push("Text near edge");
    }
    if (fontSize < 18) {
      textTooSmall = true;
      warnings.push("Text may be too small");
    }
  }

  if (hasMedia && mediaBox) {
    if (
      mediaBox.x < SAFE_MARGIN ||
      mediaBox.y < SAFE_MARGIN ||
      mediaBox.x + mediaBox.w > 100 - SAFE_MARGIN ||
      mediaBox.y + mediaBox.h > 100 - SAFE_MARGIN
    ) {
      mediaClipping = true;
      warnings.push("Media near edge");
    }
  }

  for (const dec of decorations) {
    if (
      dec.x < SAFE_MARGIN ||
      dec.y < SAFE_MARGIN ||
      dec.x > 100 - SAFE_MARGIN ||
      dec.y > 100 - SAFE_MARGIN
    ) {
      decorationClipping = true;
      warnings.push("Decoration near edge");
      break;
    }
  }

  return { textClipping, textTooSmall, mediaClipping, decorationClipping, warnings };
}

export function isAllClear(status: SafeZoneStatus): boolean {
  return status.warnings.length === 0;
}

export function readablePercentage(
  text: string,
  fontSize: number,
  boxWidth: number,
  previewWidth: number,
): number {
  if (!text.trim() || !fontSize || !boxWidth || !previewWidth) return 100;
  const charsPerLine = (boxWidth / 100) * previewWidth / (fontSize * 0.52);
  const lines = Math.ceil(text.length / Math.max(1, charsPerLine));
  const lineHeight = fontSize * 1.12;
  const availableHeight = (boxWidth / 100 * previewWidth / charsPerLine) * lineHeight * lines / previewWidth;
  return Math.min(100, Math.round(100 - Math.max(0, (lines - 4) * 25)));
}
