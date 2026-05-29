import type { Box, DecorationKind, FontOption, FontWeight } from "./packs.types";

export type { Box, DecorationKind, FontOption, FontWeight } from "./packs.types";

export type PackId = "brutalist-ui" | "editorial-marks" | "dev-meme" | "minimal-mono";
export type IntentId = "poster-hero" | "centered-manifesto" | "bottom-note" | "split-headline";

export type LayoutIntentDef = {
  id: IntentId;
  name: string;
  description: string;
  textBox: { mobile: Box; desktop: Box; square: Box };
  mediaBox: { mobile: Box; desktop: Box; square: Box };
};

export type PackDef = {
  id: PackId;
  name: string;
  description: string;
  fonts: FontOption[];
  defaultFontWeight: FontWeight;
  defaultFontIndex: number;
  decorationKinds: DecorationKind[];
  defaultBgIndex: number;
  textAlign: "left" | "center";
  lineSpacing: number;
  availableIntents: IntentId[];
};

export const FONT_OPTIONS: FontOption[] = [
  { label: "Bitmap Mono", family: '"Courier New", Courier, monospace', ratio: 0.56 },
  { label: "Editorial Serif", family: 'Georgia, "Times New Roman", serif', ratio: 0.54 },
  { label: "Archive Serif", family: '"Times New Roman", Times, serif', ratio: 0.52 },
  { label: "Poster Condensed", family: 'Impact, "Arial Black", sans-serif', ratio: 0.5 },
  { label: "Archivo Black", family: '"Archivo Black", "Arial Black", sans-serif', ratio: 0.48 },
  { label: "Space Grotesk", family: '"Space Grotesk", "Courier New", monospace', ratio: 0.55 },
  { label: "Playfair Display", family: '"Playfair Display", Georgia, serif', ratio: 0.53 },
  { label: "Instrument Serif", family: '"Instrument Serif", "Times New Roman", serif', ratio: 0.5 },
  { label: "Caveat Script", family: '"Caveat", "Comic Sans MS", cursive', ratio: 0.42 },
  { label: "Bricolage Grotesque", family: '"Bricolage Grotesque", "Arial Black", sans-serif', ratio: 0.49 },
  { label: "Anton", family: '"Anton", Impact, sans-serif', ratio: 0.47 },
  { label: "Montserrat", family: '"Montserrat", "Helvetica Neue", sans-serif', ratio: 0.52 },
];

export const FONT_WEIGHTS: FontWeight[] = [400, 700, 900];

export const ALL_DECORATION_KINDS: DecorationKind[] = [
  "frame",
  "target",
  "ruler",
  "spark",
  "caption",
  "underline",
  "circle",
  "arrow",
  "zigzag",
  "star-scribble",
  "highlight",
  "heart",
  "squiggle",
  "double-underline",
  "dot-circle",
  "oval",
  "paint-streak",
  "cross-out",
];

const LAYOUT_INTENTS: Record<IntentId, LayoutIntentDef> = {
  "poster-hero": {
    id: "poster-hero",
    name: "Poster Hero",
    description: "Bold headline with accent mark",
    textBox: {
      mobile: { x: 10, y: 32, w: 80, h: 28 },
      desktop: { x: 8, y: 36, w: 58, h: 32 },
      square: { x: 10, y: 34, w: 80, h: 26 },
    },
    mediaBox: {
      mobile: { x: 62, y: 68, w: 34, h: 26 },
      desktop: { x: 74, y: 64, w: 22, h: 30 },
      square: { x: 62, y: 66, w: 34, h: 26 },
    },
  },
  "centered-manifesto": {
    id: "centered-manifesto",
    name: "Centered Manifesto",
    description: "Everything centered and balanced",
    textBox: {
      mobile: { x: 12, y: 34, w: 76, h: 22 },
      desktop: { x: 16, y: 34, w: 68, h: 26 },
      square: { x: 14, y: 36, w: 72, h: 22 },
    },
    mediaBox: {
      mobile: { x: 26, y: 62, w: 48, h: 28 },
      desktop: { x: 30, y: 60, w: 40, h: 30 },
      square: { x: 28, y: 62, w: 44, h: 28 },
    },
  },
  "bottom-note": {
    id: "bottom-note",
    name: "Bottom Note",
    description: "Image first, text anchored below",
    textBox: {
      mobile: { x: 8, y: 62, w: 84, h: 20 },
      desktop: { x: 8, y: 64, w: 56, h: 22 },
      square: { x: 10, y: 64, w: 80, h: 20 },
    },
    mediaBox: {
      mobile: { x: 16, y: 8, w: 68, h: 46 },
      desktop: { x: 20, y: 8, w: 48, h: 48 },
      square: { x: 18, y: 8, w: 64, h: 48 },
    },
  },
  "split-headline": {
    id: "split-headline",
    name: "Split Headline",
    description: "Text and media side by side",
    textBox: {
      mobile: { x: 8, y: 30, w: 48, h: 24 },
      desktop: { x: 8, y: 34, w: 44, h: 28 },
      square: { x: 8, y: 32, w: 46, h: 24 },
    },
    mediaBox: {
      mobile: { x: 56, y: 30, w: 36, h: 28 },
      desktop: { x: 56, y: 30, w: 36, h: 34 },
      square: { x: 54, y: 32, w: 38, h: 26 },
    },
  },
};

export const PACKS: Record<PackId, PackDef> = {
  "brutalist-ui": {
    id: "brutalist-ui",
    name: "Brutalist UI",
    description: "Heavy industrial marks and bold typography. Raw edges, frame overlays, punchy weights.",
    fonts: [FONT_OPTIONS[4], FONT_OPTIONS[5], FONT_OPTIONS[10]], // Archivo Black, Space Grotesk, Anton
    defaultFontWeight: 900,
    defaultFontIndex: 0,
    decorationKinds: ["frame", "target", "ruler", "cross-out", "zigzag"],
    defaultBgIndex: 0,
    textAlign: "left",
    lineSpacing: 1.0,
    availableIntents: ["poster-hero", "split-headline"],
  },
  "editorial-marks": {
    id: "editorial-marks",
    name: "Editorial Marks",
    description: "Refined typography with handwritten notes, underlines, and refined scribble marks.",
    fonts: [FONT_OPTIONS[6], FONT_OPTIONS[7], FONT_OPTIONS[8]], // Playfair Display, Instrument Serif, Caveat Script
    defaultFontWeight: 700,
    defaultFontIndex: 0,
    decorationKinds: ["underline", "circle", "double-underline", "cross-out", "caption"],
    defaultBgIndex: 2,
    textAlign: "center",
    lineSpacing: 1.1,
    availableIntents: ["centered-manifesto", "bottom-note"],
  },
  "dev-meme": {
    id: "dev-meme",
    name: "Dev Meme",
    description: "Loud internet-native graphics. Diagonal stickers, heavy meme text, and playful shapes.",
    fonts: [FONT_OPTIONS[3], FONT_OPTIONS[0], FONT_OPTIONS[5]], // Poster Condensed, Bitmap Mono, Space Grotesk
    defaultFontWeight: 900,
    defaultFontIndex: 0,
    decorationKinds: ["spark", "star-scribble", "arrow", "heart", "oval"],
    defaultBgIndex: 0,
    textAlign: "left",
    lineSpacing: 0.95,
    availableIntents: ["poster-hero", "split-headline"],
  },
  "minimal-mono": {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Precise monospaced composition. Clean lines, dot grids, and subtle structural marks.",
    fonts: [FONT_OPTIONS[0], FONT_OPTIONS[5], FONT_OPTIONS[1]], // Bitmap Mono, Space Grotesk, Editorial Serif
    defaultFontWeight: 400,
    defaultFontIndex: 0,
    decorationKinds: ["ruler", "underline", "dot-circle", "caption"],
    defaultBgIndex: 2,
    textAlign: "left",
    lineSpacing: 1.0,
    availableIntents: ["centered-manifesto", "bottom-note"],
  },
};

export function getLayoutIntent(id: IntentId): LayoutIntentDef {
  return LAYOUT_INTENTS[id];
}

export function getLayoutIntentDefs(): LayoutIntentDef[] {
  return Object.values(LAYOUT_INTENTS);
}

export function getPackIntents(packId: PackId): LayoutIntentDef[] {
  const pack = PACKS[packId];
  return pack.availableIntents.map((id) => LAYOUT_INTENTS[id]);
}

export function remixDecorations(
  packId: PackId,
  text: string,
): { kinds: DecorationKind[]; count: number } {
  const pack = PACKS[packId];
  const kinds = pack.decorationKinds;
  let count: number;

  switch (packId) {
    case "brutalist-ui":
      count = 3 + (text.length > 8 ? 1 : 0);
      break;
    case "editorial-marks":
      count = 2 + (text.length > 6 ? 2 : 0);
      break;
    case "dev-meme":
      count = 3 + (text.length > 4 ? 2 : 0);
      break;
    case "minimal-mono":
      count = text.length > 0 ? 2 : 1;
      break;
    default:
      count = 2;
  }

  return { kinds, count };
}

export function remixPositions(
  packId: PackId,
  format: "mobile" | "desktop" | "square",
  count: number,
): Array<{ x: number; y: number; size: number }> {
  const isDesktop = format === "desktop";

  const zonePresets: Record<
    PackId,
    Array<{ x: number; y: number; size: number }>
  > = {
    "brutalist-ui": [
      { x: 62, y: 68, size: 16 },
      { x: 74, y: 60, size: 14 },
      { x: 48, y: 76, size: 18 },
      { x: 80, y: 74, size: 12 },
      { x: 66, y: 56, size: 15 },
      { x: 36, y: 72, size: 14 },
      { x: 72, y: 78, size: 11 },
      { x: 56, y: 64, size: 16 },
    ],
    "editorial-marks": [
      { x: 58, y: 62, size: 14 },
      { x: 68, y: 56, size: 12 },
      { x: 44, y: 72, size: 16 },
      { x: 76, y: 68, size: 10 },
      { x: 52, y: 52, size: 14 },
      { x: 38, y: 66, size: 13 },
    ],
    "dev-meme": [
      { x: 56, y: 66, size: 16 },
      { x: 70, y: 58, size: 18 },
      { x: 46, y: 78, size: 14 },
      { x: 78, y: 70, size: 15 },
      { x: 62, y: 56, size: 17 },
      { x: 40, y: 68, size: 16 },
      { x: 74, y: 74, size: 13 },
      { x: 52, y: 60, size: 18 },
    ],
    "minimal-mono": [
      { x: 54, y: 64, size: 14 },
      { x: 66, y: 58, size: 12 },
      { x: 48, y: 70, size: 13 },
      { x: 60, y: 74, size: 11 },
    ],
  };

  const presets = zonePresets[packId] ?? zonePresets["minimal-mono"];

  if (isDesktop) {
    for (const p of presets) {
      p.x = Math.min(88, p.x + 4);
    }
  }

  const jittered = presets.map((p) => ({
    x: p.x + (Math.random() * 8 - 4),
    y: p.y + (Math.random() * 8 - 4),
    size: p.size + (Math.random() * 4 - 2),
  }));

  const shuffled = jittered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
