import { type CanvasElement, type CanvasFormat, uid } from "../store/wallpaper";

type Palette = {
  bg: string;
  fg: string;
  accent: string;
  accent2: string;
  soft: string;
  paper: string;
};

export const PALETTES: Palette[] = [
  {
    bg: "#b35bed",
    fg: "#171019",
    accent: "#d8ff3d",
    accent2: "#fb5b35",
    soft: "#c77bf1",
    paper: "#f8f5ef",
  },
  {
    bg: "#f8f6ef",
    fg: "#202020",
    accent: "#1c44b8",
    accent2: "#f05a33",
    soft: "#e6e1d7",
    paper: "#ffffff",
  },
  {
    bg: "#0b0b0d",
    fg: "#ffffff",
    accent: "#d7ff39",
    accent2: "#f05a33",
    soft: "#242428",
    paper: "#e8e1d2",
  },
  {
    bg: "#2f91e8",
    fg: "#ffffff",
    accent: "#121212",
    accent2: "#7bdbff",
    soft: "#58acf0",
    paper: "#ffffff",
  },
  {
    bg: "#e75c38",
    fg: "#ffffff",
    accent: "#151515",
    accent2: "#ffd6c9",
    soft: "#f07150",
    paper: "#fff7ef",
  },
  {
    bg: "#f7bfd2",
    fg: "#181818",
    accent: "#6f5cf4",
    accent2: "#ef2b83",
    soft: "#f2d4de",
    paper: "#ffffff",
  },
  {
    bg: "#f6f4ed",
    fg: "#202020",
    accent: "#e9562f",
    accent2: "#1976df",
    soft: "#e7e1d8",
    paper: "#ffffff",
  },
  {
    bg: "#173d34",
    fg: "#fffaf1",
    accent: "#ff9fcb",
    accent2: "#dbff44",
    soft: "#25584c",
    paper: "#fffaf1",
  },
];

export const FONTS = [
  "Archivo Black",
  "Anton",
  "Instrument Serif",
  "Playfair Display",
  "Libre Bodoni",
  "Bricolage Grotesque",
  "Montserrat",
  "Space Grotesk",
  "Caveat",
];

export const EMOJIS = [
  "✦",
  "✺",
  "✷",
  "✸",
  "★",
  "✱",
  "❋",
  "♥",
  "→",
  "↗",
  "👀",
  "💭",
  "✨",
  "⚡",
  "❗",
  "💡",
];

const MARKS = ["✦", "✺", "✷", "★", "→", "↗", "✨", "⚡"];
const SCRIPT_NOTES = [
  "designer edition",
  "keep going",
  "say it louder",
  "made for this",
  "real talk",
  "pass it on",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function wordsOf(text: string): string[] {
  return text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
}

function sentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function smartLines(words: string[], targetLines: number): string[] {
  if (words.length === 0) return [];
  const lines = Math.max(1, Math.min(targetLines, words.length));
  const totalChars =
    words.reduce((sum, word) => sum + word.length, 0) + Math.max(0, words.length - 1);
  const target = Math.max(5, totalChars / lines);
  const result: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  words.forEach((word, index) => {
    const remainingWords = words.length - index;
    const remainingLines = lines - result.length;
    const nextLen = currentLen + (current.length ? 1 : 0) + word.length;
    const shouldBreak =
      current.length > 0 &&
      result.length < lines - 1 &&
      nextLen > target * 1.08 &&
      remainingWords >= remainingLines;

    if (shouldBreak) {
      result.push(current.join(" "));
      current = [word];
      currentLen = word.length;
    } else {
      current.push(word);
      currentLen = nextLen;
    }
  });

  if (current.length) result.push(current.join(" "));

  while (result.length > lines) {
    const tail = result.pop();
    if (tail) result[result.length - 1] = `${result[result.length - 1]} ${tail}`;
  }

  return result;
}

function splitCopy(words: string[], format: CanvasFormat) {
  const heroCount =
    words.length <= 3
      ? words.length
      : format === "desktop"
        ? Math.min(words.length, Math.ceil(words.length * 0.58))
        : Math.min(words.length, Math.ceil(words.length * 0.5));
  return { hero: words.slice(0, heroCount), support: words.slice(heroCount) };
}

function textEl(
  opts: Partial<CanvasElement> & {
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
  },
): CanvasElement {
  return {
    id: uid(),
    kind: "text",
    rotation: 0,
    fontFamily: "Montserrat",
    fontWeight: 800,
    color: "#111111",
    align: "left",
    lineHeight: 0.98,
    letterSpacing: 0,
    ...opts,
  };
}

function emojiEl(opts: {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  color: string;
  rotation?: number;
}): CanvasElement {
  return {
    id: uid(),
    kind: "emoji",
    fontFamily: "Inter",
    fontWeight: 700,
    align: "center",
    lineHeight: 1,
    rotation: 0,
    ...opts,
  };
}

function scribbleEl(opts: {
  scribble: CanvasElement["scribble"];
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  stroke: string;
  strokeWidth?: number;
  rotation?: number;
}): CanvasElement {
  return { id: uid(), kind: "scribble", rotation: 0, strokeWidth: 3, ...opts };
}

function shapeEl(opts: {
  shape: CanvasElement["shape"];
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  fill: string;
  rotation?: number;
}): CanvasElement {
  return { id: uid(), kind: "shape", rotation: 0, ...opts };
}

function addCornerMarks(els: CanvasElement[], p: Palette, format: CanvasFormat) {
  const phone = format === "phone";
  els.push(
    emojiEl({
      text: pick(MARKS),
      x: phone ? 82 : 91,
      y: phone ? 5 : 7,
      w: phone ? 5 : 3,
      h: phone ? 4 : 4,
      z: 35,
      color: p.accent,
      rotation: rand(-12, 12),
    }),
  );
  els.push(
    scribbleEl({
      scribble: pick(["squiggle", "zigzag", "star"]),
      x: phone ? 5 : 4,
      y: phone ? 8 : 10,
      w: phone ? 17 : 9,
      h: phone ? 8 : 10,
      z: 14,
      stroke: p.accent2,
      strokeWidth: 2.3,
      rotation: rand(-10, 10),
    }),
  );
}

function addMedia(
  els: CanvasElement[],
  src: string | null,
  p: Palette,
  format: CanvasFormat,
  mode: "sticker" | "poster" | "cutout" = "sticker",
) {
  if (!src) return;

  const phone = format === "phone";
  const desktop = format === "desktop";
  const spec =
    mode === "poster"
      ? desktop
        ? { x: 64, y: 33, w: 23, h: 39 }
        : phone
          ? { x: 29, y: 57, w: 42, h: 27 }
          : { x: 54, y: 57, w: 32, h: 29 }
      : mode === "cutout"
        ? desktop
          ? { x: 62, y: 29, w: 25, h: 47 }
          : phone
            ? { x: 25, y: 56, w: 50, h: 31 }
            : { x: 55, y: 53, w: 34, h: 34 }
        : desktop
          ? { x: 66, y: 47, w: 21, h: 30 }
          : phone
            ? { x: 54, y: 60, w: 34, h: 23 }
            : { x: 58, y: 60, w: 29, h: 25 };

  els.push(
    shapeEl({
      shape: "blob",
      x: spec.x - 1.2,
      y: spec.y - 1.2,
      w: spec.w + 2.4,
      h: spec.h + 2.4,
      z: 6,
      fill: p.paper,
      rotation: rand(-4, 4),
    }),
  );
  els.push({
    id: uid(),
    kind: "image",
    src,
    x: spec.x,
    y: spec.y,
    w: spec.w,
    h: spec.h,
    rotation: rand(-3, 3),
    z: 9,
  });
  els.push(
    scribbleEl({
      scribble: mode === "poster" ? "cross-out" : "circle",
      x: spec.x - 2,
      y: spec.y - 2,
      w: spec.w + 4,
      h: spec.h + 4,
      z: mode === "poster" ? 12 : 8,
      stroke: mode === "poster" ? p.accent : p.paper,
      strokeWidth: mode === "poster" ? 6 : 3,
      rotation: rand(-4, 4),
    }),
  );
}

export interface TemplateResult {
  bg: string;
  elements: CanvasElement[];
}

export function generateLayout(
  text: string,
  imageSrc: string | null,
  format: CanvasFormat,
): TemplateResult {
  const words = wordsOf(text);
  const p = pick(PALETTES);
  const layout = imageSrc
    ? pick(["trend-poster", "sticker-field", "editorial-media"] as const)
    : pick([
        "annotated-type",
        "editorial-type",
        "campaign-type",
        "sticker-field",
        "trend-poster",
      ] as const);

  switch (layout) {
    case "annotated-type":
      return buildAnnotatedType(words, p, format);
    case "editorial-type":
      return buildEditorialType(words, p, format);
    case "campaign-type":
      return buildCampaignType(words, p, format);
    case "sticker-field":
      return buildStickerField(words, p, format, imageSrc);
    case "trend-poster":
      return buildTrendPoster(words, p, format, imageSrc);
    case "editorial-media":
      return buildEditorialMedia(words, p, format, imageSrc);
  }
}

function buildAnnotatedType(words: string[], p: Palette, format: CanvasFormat): TemplateResult {
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const lineCount = desktop ? 3 : phone ? 5 : 4;
  const lines = smartLines(words, lineCount);
  const block = phone
    ? { x: 5, y: 16, w: 90, h: 67 }
    : desktop
      ? { x: 7, y: 16, w: 62, h: 64 }
      : { x: 7, y: 15, w: 86, h: 68 };

  els.push(
    shapeEl({
      shape: "ring",
      x: phone ? 20 : 13,
      y: phone ? 29 : 27,
      w: phone ? 61 : 49,
      h: phone ? 22 : 27,
      z: 4,
      fill: p.soft,
      rotation: rand(-6, 6),
    }),
  );
  els.push(
    textEl({
      text: lines.join("\n").toLowerCase(),
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      z: 25,
      fontFamily: "Archivo Black",
      fontWeight: 900,
      color: p.fg,
      align: desktop ? "left" : "center",
      lineHeight: 0.95,
      letterSpacing: 0,
    }),
  );

  const accentY = phone ? 52 : 49;
  els.push(
    scribbleEl({
      scribble: "circle",
      x: phone ? 4 : 8,
      y: accentY,
      w: phone ? 43 : 31,
      h: phone ? 11 : 13,
      z: 28,
      stroke: p.accent,
      strokeWidth: 3.2,
      rotation: rand(-4, 4),
    }),
  );
  els.push(
    scribbleEl({
      scribble: "underline",
      x: phone ? 16 : 20,
      y: phone ? 84 : 78,
      w: phone ? 68 : 42,
      h: 5,
      z: 28,
      stroke: p.accent,
      strokeWidth: 3,
    }),
  );
  els.push(
    emojiEl({
      text: "✱",
      x: phone ? 61 : 55,
      y: phone ? 25 : 21,
      w: phone ? 10 : 5,
      h: phone ? 8 : 8,
      z: 29,
      color: p.accent,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "arrow",
      x: phone ? 74 : 73,
      y: phone ? 38 : 36,
      w: phone ? 18 : 11,
      h: phone ? 16 : 16,
      z: 27,
      stroke: p.accent,
      strokeWidth: 3,
      rotation: 86,
    }),
  );
  addCornerMarks(els, p, format);

  return { bg: p.bg, elements: els };
}

function buildEditorialType(words: string[], p: Palette, format: CanvasFormat): TemplateResult {
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const { hero, support } = splitCopy(words, format);
  const heroLines = smartLines(hero, desktop ? 2 : phone ? 3 : 3);
  const supportLines = smartLines(support, desktop ? 2 : 3);
  const center = desktop
    ? { x: 18, y: 24, w: 58, h: 43 }
    : phone
      ? { x: 8, y: 20, w: 84, h: 45 }
      : { x: 9, y: 19, w: 82, h: 45 };

  els.push(
    textEl({
      text: "TIPS + NOTES FOR RIGHT NOW",
      x: desktop ? 31 : 14,
      y: phone ? 5 : 7,
      w: desktop ? 38 : 72,
      h: 3,
      z: 10,
      fontFamily: "Space Grotesk",
      fontWeight: 500,
      color: p.fg,
      align: "center",
      letterSpacing: 0,
      lineHeight: 1,
    }),
  );
  els.push(
    emojiEl({
      text: pick(["👀", "💭", "💡"]),
      x: desktop ? 47 : 45,
      y: phone ? 11 : 13,
      w: desktop ? 5 : 10,
      h: phone ? 7 : 8,
      z: 20,
      color: p.fg,
    }),
  );
  els.push(
    shapeEl({
      shape: "ring",
      x: desktop ? 24 : 13,
      y: phone ? 35 : 32,
      w: desktop ? 54 : 74,
      h: phone ? 12 : 16,
      z: 6,
      fill: p.accent,
      rotation: rand(-7, 7),
    }),
  );
  els.push(
    textEl({
      text: heroLines.join("\n"),
      x: center.x,
      y: center.y,
      w: center.w,
      h: center.h,
      z: 24,
      fontFamily: "Playfair Display",
      fontWeight: 600,
      color: p.fg,
      align: "center",
      lineHeight: 0.86,
      letterSpacing: 0,
    }),
  );

  if (support.length) {
    els.push(
      textEl({
        text: supportLines.join("\n"),
        x: desktop ? 29 : 17,
        y: phone ? 65 : 66,
        w: desktop ? 42 : 66,
        h: phone ? 12 : 13,
        z: 23,
        fontFamily: "Caveat",
        fontWeight: 700,
        color: p.accent,
        align: "center",
        lineHeight: 0.9,
        rotation: rand(-5, 5),
      }),
    );
  } else {
    els.push(
      textEl({
        text: pick(SCRIPT_NOTES),
        x: desktop ? 36 : 25,
        y: phone ? 66 : 67,
        w: desktop ? 30 : 50,
        h: 9,
        z: 23,
        fontFamily: "Caveat",
        fontWeight: 700,
        color: p.accent,
        align: "center",
        lineHeight: 0.9,
        rotation: rand(-5, 5),
      }),
    );
  }

  els.push(
    scribbleEl({
      scribble: "arrow",
      x: desktop ? 46 : 43,
      y: phone ? 82 : 84,
      w: desktop ? 10 : 16,
      h: 4,
      z: 18,
      stroke: p.fg,
      strokeWidth: 1.5,
    }),
  );
  els.push(
    textEl({
      text: "@POSTERWALL",
      x: desktop ? 40 : 30,
      y: phone ? 91 : 90,
      w: desktop ? 20 : 40,
      h: 3,
      z: 12,
      fontFamily: "Space Grotesk",
      fontWeight: 600,
      color: p.fg,
      align: "center",
      letterSpacing: 1,
    }),
  );

  return { bg: p.bg, elements: els };
}

function buildCampaignType(words: string[], p: Palette, format: CanvasFormat): TemplateResult {
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const lines = smartLines(words, desktop ? 3 : phone ? 4 : 4);
  const textBox = desktop
    ? { x: 12, y: 29, w: 64, h: 28 }
    : phone
      ? { x: 8, y: 29, w: 84, h: 29 }
      : { x: 8, y: 28, w: 84, h: 30 };

  els.push(
    textEl({
      text: lines.join("\n").toUpperCase(),
      x: textBox.x,
      y: textBox.y,
      w: textBox.w,
      h: textBox.h,
      z: 24,
      fontFamily: "Montserrat",
      fontWeight: 900,
      color: p.fg,
      align: desktop ? "left" : "center",
      lineHeight: 1.02,
      letterSpacing: 0,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "circle",
      x: desktop ? 49 : 50,
      y: phone ? 33 : 31,
      w: desktop ? 22 : 31,
      h: phone ? 8 : 9,
      z: 26,
      stroke: p.accent2,
      strokeWidth: 3.4,
      rotation: rand(-4, 4),
    }),
  );
  els.push(
    scribbleEl({
      scribble: "underline",
      x: desktop ? 15 : 11,
      y: phone ? 55 : 55,
      w: desktop ? 48 : 73,
      h: 5,
      z: 26,
      stroke: p.accent2,
      strokeWidth: 3,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "zigzag",
      x: desktop ? 16 : 12,
      y: phone ? 59 : 60,
      w: desktop ? 48 : 70,
      h: 7,
      z: 22,
      stroke: p.accent,
      strokeWidth: 3,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "arrow",
      x: desktop ? 79 : 82,
      y: phone ? 52 : 50,
      w: desktop ? 10 : 16,
      h: phone ? 21 : 23,
      z: 23,
      stroke: p.accent2,
      strokeWidth: 3,
      rotation: 90,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "arrow",
      x: desktop ? 6 : 5,
      y: phone ? 22 : 23,
      w: desktop ? 10 : 17,
      h: phone ? 12 : 15,
      z: 23,
      stroke: p.accent,
      strokeWidth: 3,
      rotation: 125,
    }),
  );
  els.push(
    emojiEl({
      text: "!!!",
      x: desktop ? 43 : 42,
      y: phone ? 13 : 14,
      w: desktop ? 9 : 16,
      h: phone ? 8 : 8,
      z: 23,
      color: p.accent2,
      rotation: rand(-3, 3),
    }),
  );

  return { bg: p.bg, elements: els };
}

function buildStickerField(
  words: string[],
  p: Palette,
  format: CanvasFormat,
  imageSrc: string | null,
): TemplateResult {
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const lines = smartLines(words, desktop ? 3 : 4);
  const textBox = desktop
    ? { x: 26, y: 31, w: 43, h: 29 }
    : phone
      ? { x: 15, y: 31, w: 70, h: 26 }
      : { x: 15, y: 29, w: 70, h: 30 };

  els.push(
    textEl({
      text: lines.join("\n"),
      x: textBox.x,
      y: textBox.y,
      w: textBox.w,
      h: textBox.h,
      z: 24,
      fontFamily: "Bricolage Grotesque",
      fontWeight: 700,
      color: p.fg,
      align: "center",
      lineHeight: 0.97,
      letterSpacing: 0,
    }),
  );

  const stickers = [
    {
      scribble: "heart" as const,
      x: desktop ? 78 : 73,
      y: phone ? 9 : 12,
      w: desktop ? 9 : 17,
      h: desktop ? 14 : 12,
      r: -12,
    },
    {
      scribble: "arrow" as const,
      x: desktop ? 68 : 66,
      y: phone ? 20 : 22,
      w: desktop ? 12 : 19,
      h: desktop ? 10 : 13,
      r: -15,
    },
    {
      scribble: "zigzag" as const,
      x: desktop ? 12 : 11,
      y: phone ? 65 : 67,
      w: desktop ? 13 : 23,
      h: desktop ? 10 : 10,
      r: 35,
    },
    {
      scribble: "circle" as const,
      x: desktop ? 57 : 58,
      y: phone ? 58 : 60,
      w: desktop ? 18 : 29,
      h: desktop ? 8 : 9,
      r: 7,
    },
  ];

  stickers.forEach((sticker, index) => {
    els.push(
      shapeEl({
        shape: "blob",
        x: sticker.x - 1.5,
        y: sticker.y - 1.5,
        w: sticker.w + 3,
        h: sticker.h + 3,
        z: 7 + index,
        fill: p.paper,
        rotation: sticker.r,
      }),
    );
    els.push(
      scribbleEl({
        scribble: sticker.scribble,
        x: sticker.x,
        y: sticker.y,
        w: sticker.w,
        h: sticker.h,
        z: 14 + index,
        stroke: index % 2 ? p.fg : p.accent,
        strokeWidth: 3.2,
        rotation: sticker.r,
      }),
    );
  });

  els.push(
    textEl({
      text: "and you!",
      x: desktop ? 59 : 61,
      y: phone ? 60 : 62,
      w: desktop ? 15 : 22,
      h: 5,
      z: 26,
      fontFamily: "Bricolage Grotesque",
      fontWeight: 700,
      color: p.fg,
      align: "center",
      lineHeight: 1,
      rotation: 10,
    }),
  );
  addMedia(els, imageSrc, p, format, "sticker");
  return { bg: p.bg, elements: els };
}

function buildTrendPoster(
  words: string[],
  p: Palette,
  format: CanvasFormat,
  imageSrc: string | null,
): TemplateResult {
  const dark = pick(PALETTES.filter((pal) => pal.bg === "#0b0b0d" || pal.fg === "#ffffff"));
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const { hero, support } = splitCopy(words, format);
  const heroLines = smartLines(hero.length ? hero : words, desktop ? 2 : 3);
  const block = desktop
    ? { x: 8, y: 8, w: 55, h: 32 }
    : phone
      ? { x: 9, y: 7, w: 82, h: 29 }
      : { x: 8, y: 8, w: 84, h: 30 };

  els.push(
    textEl({
      text: heroLines.join("\n").toUpperCase(),
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      z: 26,
      fontFamily: "Archivo Black",
      fontWeight: 900,
      color: dark.fg,
      align: desktop ? "left" : "center",
      lineHeight: 0.88,
      letterSpacing: 0,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "circle",
      x: desktop ? 17 : 12,
      y: phone ? 23 : 25,
      w: desktop ? 47 : 76,
      h: phone ? 11 : 14,
      z: 28,
      stroke: dark.accent,
      strokeWidth: 3.2,
      rotation: rand(-4, 4),
    }),
  );
  els.push(
    scribbleEl({
      scribble: "arrow",
      x: desktop ? 13 : 8,
      y: phone ? 39 : 40,
      w: desktop ? 9 : 12,
      h: 11,
      z: 18,
      stroke: dark.accent,
      strokeWidth: 2.4,
      rotation: 105,
    }),
  );

  const supportCopy = support.length ? smartLines(support, 2).join("\n") : "We trigger\nwaves";
  els.push(
    textEl({
      text: sentenceCase(supportCopy),
      x: desktop ? 9 : 11,
      y: phone ? 49 : 52,
      w: desktop ? 24 : 31,
      h: phone ? 12 : 13,
      z: 20,
      fontFamily: "Instrument Serif",
      fontWeight: 700,
      color: dark.fg,
      align: "left",
      lineHeight: 0.9,
    }),
  );

  addMedia(els, imageSrc, dark, format, "poster");
  return { bg: dark.bg, elements: els };
}

function buildEditorialMedia(
  words: string[],
  p: Palette,
  format: CanvasFormat,
  imageSrc: string | null,
): TemplateResult {
  const els: CanvasElement[] = [];
  const phone = format === "phone";
  const desktop = format === "desktop";
  const heroLines = smartLines(words, desktop ? 3 : phone ? 5 : 4);

  addMedia(els, imageSrc, p, format, "cutout");
  els.push(
    shapeEl({
      shape: "blob",
      x: desktop ? 5 : 6,
      y: phone ? 13 : 16,
      w: desktop ? 53 : 80,
      h: phone ? 42 : 39,
      z: 5,
      fill: p.soft,
      rotation: rand(-4, 4),
    }),
  );
  els.push(
    textEl({
      text: heroLines.join("\n").toUpperCase(),
      x: desktop ? 9 : 9,
      y: phone ? 18 : 21,
      w: desktop ? 47 : 74,
      h: phone ? 33 : 31,
      z: 25,
      fontFamily: "Montserrat",
      fontWeight: 900,
      color: p.fg,
      align: desktop ? "left" : "center",
      lineHeight: 0.95,
      letterSpacing: 0,
    }),
  );
  els.push(
    scribbleEl({
      scribble: "underline",
      x: desktop ? 12 : 16,
      y: phone ? 52 : 54,
      w: desktop ? 42 : 57,
      h: 5,
      z: 27,
      stroke: p.accent2,
      strokeWidth: 3,
    }),
  );
  els.push(
    textEl({
      text: pick(SCRIPT_NOTES),
      x: desktop ? 11 : 19,
      y: phone ? 78 : 80,
      w: desktop ? 31 : 62,
      h: 8,
      z: 22,
      fontFamily: "Caveat",
      fontWeight: 700,
      color: p.accent,
      align: "center",
      lineHeight: 0.9,
      rotation: rand(-5, 5),
    }),
  );
  addCornerMarks(els, p, format);

  return { bg: p.bg, elements: els };
}
