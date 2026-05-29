import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  CheckCheck,
  Download,
  ImagePlus,
  Info,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Unlock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_DECORATION_KINDS, FONT_OPTIONS, FONT_WEIGHTS } from "../lib/packs";
import type { DecorationKind, FontOption, FontWeight } from "../lib/packs.types";
import { createUndoRedo, type Snapshot } from "../lib/undo-redo";
import { checkSafeZone, isAllClear, type SafeZoneStatus } from "../lib/safe-zone";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Anton&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Caveat:wght@400;700&family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Space+Grotesk:wght@400;700&display=swap",
      },
    ],
    meta: [
      { title: "Wallcraft — Monochrome Bitmap Wallpaper Creator" },
      {
        name: "description",
        content:
          "Create raw monochrome bitmap wallpapers for mobile and desktop. Design with curated creative packs.",
      },
    ],
  }),
  component: Index,
});

type Format = "mobile" | "desktop" | "square";
type MediaMode = "monochrome" | "color";

type Point = {
  x: number;
  y: number;
};

type Box = Point & {
  w: number;
  h: number;
};

type ResizeHandle = "n" | "e" | "s" | "w" | "nw" | "ne" | "sw" | "se";

type BackgroundOption = {
  label: string;
  value: string;
  ink: string;
  mediaInk: string;
};

type ColorOption = {
  label: string;
  value: string;
};

type GifResult = {
  id: string;
  title: string;
  thumb: string;
  full: string;
};

type PlacedDecoration = {
  id: string;
  kind: DecorationKind;
  x: number;
  y: number;
  size: number;
  locked: boolean;
};

type SelectedElement = "text" | "media" | `decoration:${string}` | null;

const BACKGROUNDS: BackgroundOption[] = [
  { label: "Pure Black", value: "#050505", ink: "#f2f2ef", mediaInk: "#f2f2ef" },
  { label: "Pure White", value: "#ffffff", ink: "#1f2020", mediaInk: "#303232" },
  { label: "Off-White", value: "#e8e9e6", ink: "#434545", mediaInk: "#5c5f5f" },
  { label: "Cream", value: "#ece4d4", ink: "#3d3b37", mediaInk: "#5d5951" },
  { label: "Warm Gray", value: "#b9b6ae", ink: "#242424", mediaInk: "#484848" },
  { label: "Cool Gray", value: "#c7cdcd", ink: "#262a2a", mediaInk: "#4e5353" },
];

const FORMAT_META: Record<Format, { label: string; width: number; height: number }> = {
  mobile: { label: "Mobile", width: 2160, height: 3840 },
  desktop: { label: "Desktop", width: 3840, height: 2160 },
  square: { label: "Square", width: 3840, height: 3840 },
};

const MAX_CHARS = 30;
const TENOR_KEY = "LIVDSRZULELA";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Index() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<Format>("mobile");
  const [bg, setBg] = useState(BACKGROUNDS[2]);
  const [media, setMedia] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<MediaMode>("monochrome");
  const [removeBg, setRemoveBg] = useState(false);
  const [textLocked, setTextLocked] = useState(false);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [showHighlightHelp, setShowHighlightHelp] = useState(false);
  const [font, setFont] = useState(FONT_OPTIONS[0]);
  const [fontWeight, setFontWeight] = useState<FontWeight>(900);
  const [textColor, setTextColor] = useState(BACKGROUNDS[2].ink);
  const [highlightWordIndex, setHighlightWordIndex] = useState<number | null>(null);
  const [highlightColor, setHighlightColor] = useState(BACKGROUNDS[2].ink);
  const [fontSizeScale, setFontSizeScale] = useState(100);
  const [lineSpacing, setLineSpacing] = useState(0.9);
  const [letterSpacing, setLetterSpacing] = useState(-0.12);
  const [textBox, setTextBox] = useState<Box>(getDefaultTextBox("mobile"));
  const [mediaBox, setMediaBox] = useState<Box>(getDefaultMediaBox("mobile"));
  const [decorations, setDecorations] = useState<PlacedDecoration[]>([]);
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [addingGifId, setAddingGifId] = useState<string | null>(null);
  const gifSearchSeq = useRef(0);
  const gifSearchAbortRef = useRef<AbortController | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightHelpRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<File | null>(null);

  const normalizedText = text.trim();
  const textLines = useMemo(() => makeTextLines(normalizedText, format), [format, normalizedText]);
  const textWords = useMemo(() => textLines.join(" ").split(/\s+/).filter(Boolean), [textLines]);
  const textPalette = useMemo(() => getTextPalette(bg), [bg]);
  const canvasStyle = useMemo(
    () =>
      getTextStyle(
        format,
        textLines,
        previewSize,
        textBox,
        font,
        fontWeight,
        fontSizeScale,
        lineSpacing,
        letterSpacing,
        textColor,
      ),
    [
      format,
      textLines,
      previewSize,
      textBox,
      font,
      fontWeight,
      fontSizeScale,
      lineSpacing,
      letterSpacing,
      textColor,
    ],
  );
  const meta = FORMAT_META[format];

  const history = useRef(createUndoRedo(80));

  const captureSnapshot = useCallback(
    (): Snapshot => ({
      text,
      format,
      bg: bg.label,
      media,
      mediaName,
      mediaMode,
      removeBg,
      fontLabel: font.label,
      fontWeight,
      textBox: { ...textBox },
      mediaBox: { ...mediaBox },
      decorations: decorations.map((d) => ({ ...d })),
      textLocked,
      mediaLocked,
      fontSizeScale,
      lineSpacing,
      letterSpacing,
      textColor,
      highlightWordIndex,
      highlightColor,
    }),
    [
      text,
      format,
      bg,
      media,
      mediaName,
      mediaMode,
      removeBg,
      font,
      fontWeight,
      textBox,
      mediaBox,
      decorations,
      textLocked,
      mediaLocked,
      fontSizeScale,
      lineSpacing,
      letterSpacing,
      textColor,
      highlightWordIndex,
      highlightColor,
    ],
  );

  const restoreSnapshot = useCallback((snap: Snapshot) => {
    if (snap.text !== undefined) setText(snap.text as string);
    if (snap.format) setFormat(snap.format as Format);
    if (snap.bg) {
      const found = BACKGROUNDS.find((b) => b.label === snap.bg);
      if (found) setBg(found);
    }
    if (snap.media !== undefined) setMedia(snap.media as string | null);
    if (snap.mediaName !== undefined) setMediaName(snap.mediaName as string | null);
    if (snap.mediaMode) setMediaMode(snap.mediaMode as MediaMode);
    if (snap.removeBg !== undefined) setRemoveBg(snap.removeBg as boolean);
    if (snap.fontLabel) {
      const found = FONT_OPTIONS.find((f) => f.label === snap.fontLabel);
      if (found) setFont(found);
    }
    if (snap.fontWeight) setFontWeight(snap.fontWeight as FontWeight);
    if (snap.textBox) setTextBox(snap.textBox as Box);
    if (snap.mediaBox) setMediaBox(snap.mediaBox as Box);
    if (snap.decorations)
      setDecorations((snap.decorations as PlacedDecoration[]).map((d) => ({ ...d })));
    if (snap.textLocked !== undefined) setTextLocked(snap.textLocked as boolean);
    if (snap.mediaLocked !== undefined) setMediaLocked(snap.mediaLocked as boolean);
    if (snap.fontSizeScale !== undefined) setFontSizeScale(snap.fontSizeScale as number);
    if (snap.lineSpacing !== undefined) setLineSpacing(snap.lineSpacing as number);
    if (snap.letterSpacing !== undefined) setLetterSpacing(snap.letterSpacing as number);
    if (snap.textColor !== undefined) setTextColor(snap.textColor as string);
    if (snap.highlightWordIndex !== undefined)
      setHighlightWordIndex(snap.highlightWordIndex as number | null);
    if (snap.highlightColor !== undefined) setHighlightColor(snap.highlightColor as string);
  }, []);

  useEffect(() => {
    if (highlightWordIndex === null) return;
    if (highlightWordIndex >= textWords.length) setHighlightWordIndex(null);
  }, [highlightWordIndex, textWords.length]);

  useEffect(() => {
    if (!showHighlightHelp) return;

    function onPointerDown(event: PointerEvent) {
      if (!highlightHelpRef.current) return;
      if (highlightHelpRef.current.contains(event.target as Node)) return;
      setShowHighlightHelp(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showHighlightHelp]);

  function setHighlightFromSelection() {
    const input = textRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (end <= start) {
      setHighlightWordIndex(null);
      return;
    }

    const mid = Math.floor((start + end) / 2);
    const source = input.value;
    const matches = [...source.matchAll(/\S+/g)];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const index = match.index ?? 0;
      const wordEnd = index + match[0].length;
      if (mid >= index && mid <= wordEnd) {
        setHighlightWordIndex(i);
        if (highlightColor === bg.value) {
          setHighlightColor(textColor);
        }
        return;
      }
    }

    setHighlightWordIndex(null);
  }

  const pushHistory = useCallback(() => {
    history.current.push(captureSnapshot());
  }, [captureSnapshot]);

  const undo = useCallback(() => {
    const snap = history.current.undo(captureSnapshot());
    if (snap) restoreSnapshot(snap);
  }, [captureSnapshot, restoreSnapshot]);

  const redo = useCallback(() => {
    const snap = history.current.redo(captureSnapshot());
    if (snap) restoreSnapshot(snap);
  }, [captureSnapshot, restoreSnapshot]);

  const snapToGrid = useCallback((value: number, grid = 5): number => {
    return Math.round(value / grid) * grid;
  }, []);

  const safeZoneStatus = useMemo(
    () =>
      checkSafeZone(
        normalizedText ? textBox : null,
        media ? mediaBox : null,
        decorations,
        !!normalizedText,
        !!media,
        typeof canvasStyle.fontSize === "number" ? canvasStyle.fontSize : 0,
      ),
    [normalizedText, media, textBox, mediaBox, decorations, canvasStyle.fontSize],
  );

  const allClear = useMemo(() => isAllClear(safeZoneStatus), [safeZoneStatus]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setPreviewSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [format]);

  const toggleLock = (target: "text" | "media" | string) => {
    pushHistory();
    if (target === "text") setTextLocked(!textLocked);
    else if (target === "media") setMediaLocked(!mediaLocked);
    else {
      setDecorations((current) =>
        current.map((d) => (d.id === target ? { ...d, locked: !d.locked } : d)),
      );
    }
  };

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    mediaFileRef.current = file;
    setMediaName(file.name);
    pushHistory();
    setMedia(await processMediaFile(file, bg, mediaMode, removeBg));
  }

  async function setBackground(option: BackgroundOption) {
    pushHistory();
    setBg(option);
    const file = mediaFileRef.current;
    if (!file) return;

    setMedia(await processMediaFile(file, option, mediaMode, removeBg));
  }

  async function setMediaTreatment(nextMode: MediaMode) {
    pushHistory();
    setMediaMode(nextMode);
    const file = mediaFileRef.current;
    if (!file) return;
    setMedia(await processMediaFile(file, bg, nextMode, removeBg));
  }

  async function setRemoveBackground(nextValue: boolean) {
    pushHistory();
    setRemoveBg(nextValue);
    const file = mediaFileRef.current;
    if (!file) return;
    setMedia(await processMediaFile(file, bg, mediaMode, nextValue));
  }

  async function searchGifs() {
    const q = gifQuery.trim();
    if (q.length < 2) {
      gifSearchSeq.current += 1;
      gifSearchAbortRef.current?.abort();
      setGifLoading(false);
      setGifError(null);
      setGifResults([]);
      return;
    }
    const seq = ++gifSearchSeq.current;
    gifSearchAbortRef.current?.abort();
    const controller = new AbortController();
    gifSearchAbortRef.current = controller;
    setGifLoading(true);
    setGifError(null);
    try {
      const results = await searchTenorGifs(q, controller.signal);
      if (seq !== gifSearchSeq.current) return;
      setGifResults(results);
    } catch (error) {
      if (seq !== gifSearchSeq.current) return;
      if (error instanceof Error && error.name === "AbortError") return;
      setGifResults([]);
      setGifError(error instanceof Error ? error.message : "GIF search failed");
    } finally {
      if (seq === gifSearchSeq.current) setGifLoading(false);
    }
  }

  useEffect(() => {
    const q = gifQuery.trim();
    if (q.length < 2) {
      gifSearchSeq.current += 1;
      gifSearchAbortRef.current?.abort();
      setGifLoading(false);
      setGifError(null);
      setGifResults([]);
      return;
    }

    const id = window.setTimeout(() => {
      void searchGifs();
    }, 340);

    return () => window.clearTimeout(id);
  }, [gifQuery]);

  async function selectGif(result: GifResult) {
    setAddingGifId(result.id);
    mediaFileRef.current = null;
    pushHistory();
    setMedia(result.thumb);
    setMediaName(result.title);
    setSelectedElement("media");

    try {
      setMedia((current) => (current === result.thumb ? result.full : current));
      const src = await toDataUrlSafe(result.full);
      setMedia((current) => (current === result.full || current === result.thumb ? src : current));
    } catch {
      // Keep direct URL in preview if conversion fails.
    } finally {
      setAddingGifId((current) => (current === result.id ? null : current));
    }
  }

  async function download() {
    if (!canvasRef.current) return;
    setIsExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 40));

    try {
      const node = canvasRef.current;
      const rect = node.getBoundingClientRect();
      const scaleX = meta.width / Math.max(1, rect.width);
      const scaleY = meta.height / Math.max(1, rect.height);
      const pixelRatio = Math.min(scaleX, scaleY);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: bg.value,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `bitmap-wallpaper-${format}-${Date.now()}.png`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }

  function clearMedia() {
    pushHistory();
    setMedia(null);
    setMediaName(null);
    mediaFileRef.current = null;
    setSelectedElement((current) => (current === "media" ? null : current));
    if (fileRef.current) fileRef.current.value = "";
  }

  function deleteSelected() {
    if (!selectedElement) return;
    pushHistory();

    if (selectedElement === "media") {
      clearMedia();
      return;
    }

    if (selectedElement === "text") {
      setText("");
      setSelectedElement(null);
      return;
    }

    if (selectedElement.startsWith("decoration:")) {
      const id = selectedElement.slice("decoration:".length);
      setDecorations((current) => current.filter((item) => item.id !== id));
      setSelectedElement(null);
    }
  }

  function changeFormat(nextFormat: Format) {
    pushHistory();
    setFormat(nextFormat);
    setTextBox(getDefaultTextBox(nextFormat));
    setMediaBox(getDefaultMediaBox(nextFormat));
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditing =
        target?.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";

      if (event.key === "?" && !isEditing) {
        event.preventDefault();
        setShowCheatsheet((prev) => !prev);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "z" && !event.shiftKey && !isEditing) {
        event.preventDefault();
        undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "z" && event.shiftKey && !isEditing) {
        event.preventDefault();
        redo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "l" && selectedElement && !isEditing) {
        event.preventDefault();
        if (selectedElement === "text") toggleLock("text");
        else if (selectedElement === "media") toggleLock("media");
        else if (selectedElement.startsWith("decoration:"))
          toggleLock(selectedElement.replace("decoration:", ""));
        return;
      }

      if (event.key === "g" && !event.metaKey && !event.ctrlKey && !isEditing && selectedElement) {
        event.preventDefault();
        setSnapEnabled((prev) => !prev);
        return;
      }

      if (event.key === "Escape") {
        if (showCheatsheet) setShowCheatsheet(false);
      }

      if (!selectedElement) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (isEditing) return;

      event.preventDefault();
      deleteSelected();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedElement,
    pushHistory,
    undo,
    redo,
    textLocked,
    mediaLocked,
    showCheatsheet,
    showCheatsheet,
  ]);

  function decorationLabel(kind: DecorationKind): string {
    return kind.replace(/-/g, " ").replace(/scribble/, "");
  }

  function defaultAssetSize(kind: DecorationKind) {
    if (kind === "ruler") return 24;
    if (kind === "caption" || kind === "frame" || kind === "target") return 20;
    if (kind === "highlight") return 22;
    if (kind === "paint-streak" || kind === "oval") return 18;
    if (kind === "heart" || kind === "star-scribble") return 12;
    return 14;
  }

  function addDecoration(kind: DecorationKind) {
    pushHistory();
    setDecorations((current) => [
      ...current,
      {
        id: uid(),
        kind,
        x: snapEnabled ? snapToGrid(format === "mobile" ? 62 : 72) : format === "mobile" ? 62 : 72,
        y: snapEnabled ? snapToGrid(format === "mobile" ? 68 : 64) : format === "mobile" ? 68 : 64,
        size: defaultAssetSize(kind),
        locked: false,
      },
    ]);
  }

  function resizeDecoration(id: string, nextSize: number) {
    setDecorations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              size: clamp(nextSize, 6, 55),
            }
          : item,
      ),
    );
  }

  function moveDecoration(id: string, point: Point) {
    setDecorations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              x: clamp(point.x, 0, 96),
              y: clamp(point.y, 0, 96),
            }
          : item,
      ),
    );
  }

  return (
    <main className="bitmap-app bg-[#dedfdd] text-[#404242]">
      <section className="bitmap-shell grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="bitmap-panel border-b border-[#4c4d4d] bg-[#e2e3e1] p-5 lg:border-b-0 lg:border-r">
          <div className="mb-8 border-b border-[#4c4d4d] pb-5">
            <p className="bitmap-kicker">Wallpaper Creator</p>
            <h1 className="bitmap-title mt-2">Wallcraft</h1>
          </div>

          <div className="space-y-7">
            <div className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em]">Text</span>
                <div ref={highlightHelpRef} className="relative">
                  <button
                    className="bitmap-info-trigger"
                    type="button"
                    title="How highlight works"
                    onClick={() => setShowHighlightHelp((prev) => !prev)}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {showHighlightHelp && (
                    <div className="absolute right-0 top-7 z-20 w-[280px] border border-[#4c4d4d] bg-[#e2e3e1] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                          Word Highlight
                        </p>
                        <button
                          className="bitmap-choice text-[10px]"
                          onClick={() => setShowHighlightHelp(false)}
                        >
                          Close
                        </button>
                      </div>
                      <ol className="space-y-1.5 text-[10px] uppercase tracking-[0.12em]">
                        <li>1. Type text in the input.</li>
                        <li>2. Select a word in the input.</li>
                        <li>3. Use top color chips to recolor that word.</li>
                        <li>4. Clear selection to edit all text color.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                onSelect={setHighlightFromSelection}
                onKeyUp={setHighlightFromSelection}
                onMouseUp={setHighlightFromSelection}
                rows={3}
                placeholder="TYPE A WORD"
                className="bitmap-input min-h-28 resize-none"
              />
              <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.18em]">
                <span>
                  {text.length}/{MAX_CHARS}
                </span>
                <span>{normalizedText ? "Live" : "Blank canvas"}</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {textPalette.map((option) => (
                  <button
                    key={option.label}
                    className={`bitmap-colorchip ${
                      (highlightWordIndex !== null ? highlightColor : textColor) === option.value
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() => {
                      if (highlightWordIndex !== null) {
                        setHighlightColor(option.value);
                        return;
                      }
                      setTextColor(option.value);
                    }}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <Control label="Typeface">
              <select
                className="bitmap-select"
                value={font.label}
                onChange={(e) =>
                  setFont(FONT_OPTIONS.find((option) => option.label === e.target.value) ?? font)
                }
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-3 border border-[#4c4d4d]">
                {FONT_WEIGHTS.map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setFontWeight(weight)}
                    className={`bitmap-choice border-r border-[#4c4d4d] last:border-r-0 ${
                      fontWeight === weight ? "is-active" : ""
                    }`}
                  >
                    {weight}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-[0.14em]">
                  Size
                  <input
                    type="range"
                    min={70}
                    max={170}
                    value={fontSizeScale}
                    onChange={(e) => setFontSizeScale(Number(e.target.value))}
                    className="bitmap-range mt-1 w-full"
                  />
                </label>
                <label className="text-[10px] uppercase tracking-[0.14em]">
                  Line
                  <input
                    type="range"
                    min={80}
                    max={140}
                    value={Math.round(lineSpacing * 100)}
                    onChange={(e) => setLineSpacing(Number(e.target.value) / 100)}
                    className="bitmap-range mt-1 w-full"
                  />
                </label>
              </div>
              <label className="mt-2 block text-[10px] uppercase tracking-[0.14em]">
                Letter
                <input
                  type="range"
                  min={-20}
                  max={12}
                  value={Math.round(letterSpacing * 100)}
                  onChange={(e) => setLetterSpacing(Number(e.target.value) / 100)}
                  className="bitmap-range mt-1 w-full"
                />
              </label>
            </Control>

            <Control label="Format">
              <div className="grid grid-cols-3 border border-[#4c4d4d]">
                {(Object.keys(FORMAT_META) as Format[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => changeFormat(key)}
                    className={`bitmap-choice border-r border-[#4c4d4d] last:border-r-0 ${
                      format === key ? "is-active" : ""
                    }`}
                  >
                    {FORMAT_META[key].label}
                  </button>
                ))}
              </div>
            </Control>

            <Control label="Background">
              <div className="grid grid-cols-2 gap-px border border-[#4c4d4d] bg-[#4c4d4d]">
                {BACKGROUNDS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setBackground(option)}
                    className={`bitmap-swatch ${bg.label === option.label ? "is-active" : ""}`}
                    style={{ backgroundColor: option.value, color: option.ink }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Control>

            <Control label="Image / GIF">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />
              <div className="grid gap-2">
                <button className="bitmap-button" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" />
                  Upload
                </button>
                {media && (
                  <button className="bitmap-button" onClick={clearMedia}>
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 border border-[#4c4d4d]">
                <button
                  className={`bitmap-choice border-r border-[#4c4d4d] ${
                    mediaMode === "monochrome" ? "is-active" : ""
                  }`}
                  onClick={() => setMediaTreatment("monochrome")}
                >
                  Mono
                </button>
                <button
                  className={`bitmap-choice ${mediaMode === "color" ? "is-active" : ""}`}
                  onClick={() => setMediaTreatment("color")}
                >
                  Color
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 border border-[#4c4d4d]">
                <button
                  className={`bitmap-choice border-r border-[#4c4d4d] ${removeBg ? "is-active" : ""}`}
                  onClick={() => setRemoveBackground(true)}
                >
                  Remove BG
                </button>
                <button
                  className={`bitmap-choice ${removeBg ? "" : "is-active"}`}
                  onClick={() => setRemoveBackground(false)}
                >
                  Keep BG
                </button>
              </div>
              <p className="mt-2 min-h-4 truncate text-[11px] uppercase tracking-[0.14em]">
                {mediaName || "Optional"}
              </p>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <input
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void searchGifs();
                  }}
                  placeholder="SEARCH GIFS"
                  className="bitmap-mini-input"
                />
                <button className="bitmap-icon-button" onClick={searchGifs} disabled={gifLoading}>
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {gifLoading && (
                <p className="mt-2 animate-pulse text-[11px] uppercase tracking-[0.14em]">
                  Searching...
                </p>
              )}
              {!gifLoading && gifResults.length > 0 && (
                <div className="bitmap-gif-grid mt-2">
                  {gifResults.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => selectGif(gif)}
                      title={gif.title}
                      className={addingGifId === gif.id ? "is-adding" : ""}
                      disabled={addingGifId !== null}
                    >
                      <img src={gif.thumb} alt="" />
                      {addingGifId === gif.id && <span className="bitmap-gif-status">Adding...</span>}
                    </button>
                  ))}
                </div>
              )}
              {!gifLoading && gifResults.length === 0 && gifQuery.length > 0 && (
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em]">No GIF results</p>
              )}
              {gifError && (
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#8f2f2f]">
                  {gifError}
                </p>
              )}
            </Control>

            <Control label="Assets">
              <div className="bitmap-asset-grid">
                {ALL_DECORATION_KINDS.map((kind) => (
                  <button key={kind} onClick={() => addDecoration(kind)}>
                    <Plus className="h-3 w-3" />
                    {decorationLabel(kind)}
                  </button>
                ))}
              </div>
            </Control>
          </div>

          <div className="mt-8 border-t border-[#4c4d4d] pt-5 space-y-3">
            <div className="border border-[#4c4d4d] p-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] mb-1.5">
                <span className="font-bold">Safe zone</span>
                <span
                  className={`flex items-center gap-1 ${allClear ? "text-[#2d5a27]" : "text-[#b84a3c]"}`}
                >
                  {allClear ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {allClear ? "All clear" : `${safeZoneStatus.warnings.length} issues`}
                </span>
              </div>
              {!allClear && (
                <ul className="text-[10px] uppercase tracking-[0.12em] space-y-0.5 list-disc list-inside">
                  {safeZoneStatus.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em]">
              <button
                className={`bitmap-choice text-[11px] ${snapEnabled ? "is-active" : ""}`}
                onClick={() => setSnapEnabled(!snapEnabled)}
              >
                Snap {snapEnabled ? "ON" : "OFF"}
              </button>
              <span className="text-[10px] opacity-60">
                Press <kbd className="font-bold">G</kbd> to toggle
              </span>
            </div>

            <button
              className="bitmap-download w-full text-[11px]"
              disabled={isExporting}
              onClick={download}
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Rendering" : "Quick PNG"}
            </button>
            <button
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
              onClick={() => {
                pushHistory();
                setText("");
                clearMedia();
                setDecorations([]);
                setTextBox(getDefaultTextBox(format));
                setMediaBox(getDefaultMediaBox(format));
                setFontSizeScale(100);
                setLineSpacing(0.9);
                setLetterSpacing(-0.12);
                setTextColor(bg.ink);
                setHighlightWordIndex(null);
                setSelectedElement(null);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </aside>

        <section className="bitmap-preview-pane">
          <div className="bitmap-preview-inner">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
              <span>Live Preview</span>
              <span>
                {meta.width}x{meta.height}
              </span>
            </div>

            <div className="bitmap-preview-wrap">
              <div
                ref={canvasRef}
                data-format={format}
                className={`bitmap-wallpaper ${isExporting ? "is-exporting" : ""}`}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) setSelectedElement(null);
                }}
                style={{
                  aspectRatio: `${meta.width} / ${meta.height}`,
                  backgroundColor: bg.value,
                  color: bg.ink,
                }}
              >
                {selectedElement && (
                  <div className="bitmap-selection-toolbar">
                    <span className="bitmap-selection-chip">
                      {selectedElementLabel(selectedElement)}
                      {(selectedElement === "text" && textLocked) ||
                      (selectedElement === "media" && mediaLocked) ||
                      (selectedElement.startsWith("decoration:") &&
                        decorations.find((d) => d.id === selectedElement.replace("decoration:", ""))
                          ?.locked) ? (
                        <Lock className="h-3 w-3 ml-1" />
                      ) : null}
                    </span>
                    <button
                      className="bitmap-selection-delete"
                      onClick={() => {
                        if (selectedElement === "text") toggleLock("text");
                        else if (selectedElement === "media") toggleLock("media");
                        else if (selectedElement.startsWith("decoration:"))
                          toggleLock(selectedElement.replace("decoration:", ""));
                      }}
                    >
                      {(selectedElement === "text" && textLocked) ||
                      (selectedElement === "media" && mediaLocked) ||
                      (selectedElement.startsWith("decoration:") &&
                        decorations.find((d) => d.id === selectedElement.replace("decoration:", ""))
                          ?.locked) ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      {(selectedElement === "text" && textLocked) ||
                      (selectedElement === "media" && mediaLocked) ||
                      (selectedElement.startsWith("decoration:") &&
                        decorations.find((d) => d.id === selectedElement.replace("decoration:", ""))
                          ?.locked)
                        ? "Unlock"
                        : "Lock"}
                    </button>
                    <button className="bitmap-selection-delete" onClick={deleteSelected}>
                      <X className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
                {normalizedText && (
                  <div
                    className={`bitmap-wallpaper-text bitmap-canvas-object ${
                      selectedElement === "text" ? "is-selected" : ""
                    }`}
                    style={canvasStyle}
                    onPointerDown={(e) => {
                      setSelectedElement("text");
                      startBoxMove(e, canvasRef, textBox, setTextBox);
                    }}
                  >
                    {renderTextWithHighlight(textLines, highlightWordIndex, highlightColor)}
                    {selectedElement === "text" && (
                      <ResizeHandles
                        onResize={(e, handle) =>
                          startBoxResize(e, canvasRef, textBox, setTextBox, handle, {
                            minW: 18,
                            minH: 8,
                            maxW: 94,
                            maxH: 54,
                          })
                        }
                      />
                    )}
                  </div>
                )}

                {media && (
                  <div
                    className={`bitmap-media-frame bitmap-canvas-object ${
                      selectedElement === "media" ? "is-selected" : ""
                    }`}
                    style={{
                      left: `${mediaBox.x}%`,
                      top: `${mediaBox.y}%`,
                      width: `${mediaBox.w}%`,
                      height: `${mediaBox.h}%`,
                    }}
                    onPointerDown={(e) => {
                      setSelectedElement("media");
                      startBoxMove(e, canvasRef, mediaBox, setMediaBox);
                    }}
                  >
                    <img
                      src={media}
                      alt=""
                      crossOrigin="anonymous"
                      className="bitmap-media"
                      style={{
                        filter:
                          mediaMode === "monochrome" && !media.startsWith("data:image/png")
                            ? "grayscale(1) contrast(1.55)"
                            : "none",
                      }}
                    />
                    {selectedElement === "media" && (
                      <ResizeHandles
                        onResize={(e, handle) =>
                          startBoxResize(e, canvasRef, mediaBox, setMediaBox, handle, {
                            minW: 10,
                            minH: 8,
                            maxW: 78,
                            maxH: 62,
                          })
                        }
                      />
                    )}
                  </div>
                )}

                {decorations.map((asset) => (
                  <button
                    key={asset.id}
                    className={`bitmap-decoration bitmap-canvas-object ${
                      selectedElement === `decoration:${asset.id}` ? "is-selected" : ""
                    }`}
                    style={{
                      left: `${asset.x}%`,
                      top: `${asset.y}%`,
                      width: `${asset.size}%`,
                      height: `${asset.size}%`,
                      color: bg.ink,
                    }}
                    onPointerDown={(e) => {
                      setSelectedElement(`decoration:${asset.id}`);
                      if (asset.locked) return;
                      startDrag(
                        e,
                        canvasRef,
                        (point) => moveDecoration(asset.id, point),
                        pushHistory,
                      );
                    }}
                    aria-label={`Move ${asset.kind}`}
                  >
                    <DecorationSvg kind={asset.kind} />
                    {selectedElement === `decoration:${asset.id}` && (
                      <ResizeHandles
                        onResize={(e) =>
                          startAssetResize(
                            e,
                            canvasRef,
                            asset,
                            (nextSize) => resizeDecoration(asset.id, nextSize),
                            pushHistory,
                          )
                        }
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      {showCheatsheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm"
          onClick={() => setShowCheatsheet(false)}
        >
          <div
            className="bitmap-panel max-h-[85vh] w-[420px] max-w-[95vw] overflow-y-auto border border-[#4c4d4d] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="bitmap-title text-base">Keyboard Shortcuts</h2>
              <button
                className="bitmap-choice text-[10px]"
                onClick={() => setShowCheatsheet(false)}
              >
                ESC
              </button>
            </div>
            <div className="space-y-3 text-[11px] uppercase tracking-[0.14em]">
              {[
                ["Ctrl+Z", "Undo"],
                ["Ctrl+Shift+Z", "Redo"],
                ["Ctrl+L", "Lock/unlock selected"],
                ["G", "Toggle snap to grid"],
                ["Delete / Backspace", "Delete selected"],
                ["?", "Toggle this cheatsheet"],
                ["Esc", "Close panels / deselect"],
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between items-center">
                  <kbd className="bitmap-choice text-[10px] px-2 py-0.5 font-bold">{key}</kbd>
                  <span className="text-[10px]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
      {children}
    </label>
  );
}

function ResizeHandles({
  onResize,
}: {
  onResize: (event: React.PointerEvent<HTMLSpanElement>, handle: ResizeHandle) => void;
}) {
  return (
    <>
      {(["n", "e", "s", "w", "nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
        <span
          key={handle}
          className="bitmap-resize-handle"
          data-handle={handle}
          onPointerDown={(event) => onResize(event, handle)}
        />
      ))}
    </>
  );
}

function DecorationSvg({ kind }: { kind: DecorationKind }) {
  if (kind === "target") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="43" />
        <circle cx="50" cy="50" r="22" />
        <path d="M50 0v18M50 82v18M0 50h18M82 50h18" />
      </svg>
    );
  }

  if (kind === "ruler") {
    return (
      <svg viewBox="0 0 180 34" aria-hidden="true">
        <path d="M2 17H178" />
        {Array.from({ length: 13 }).map((_, i) => (
          <path key={i} d={`M${8 + i * 14} 10V24`} />
        ))}
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 6l9 34 35 10-35 10-9 34-10-34L6 50l34-10z" />
      </svg>
    );
  }

  if (kind === "caption") {
    return (
      <svg viewBox="0 0 180 52" aria-hidden="true">
        <path d="M3 3h174v46H3z" />
        <path d="M17 18h82M17 33h142" />
      </svg>
    );
  }

  if (kind === "circle") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
        <path d="M50 5 C 80 5, 95 30, 95 50 C 95 75, 70 90, 50 90 C 30 90, 5 75, 5 50" />
      </svg>
    );
  }

  if (kind === "underline") {
    return (
      <svg viewBox="0 0 100 40" aria-hidden="true" preserveAspectRatio="none">
        <path d="M3 18 Q 15 32, 30 18 T 55 18 T 80 18 T 97 18" />
        <path d="M3 26 Q 20 12, 35 26 T 65 26 T 97 26" />
      </svg>
    );
  }

  if (kind === "arrow") {
    return (
      <svg viewBox="0 0 100 60" aria-hidden="true" preserveAspectRatio="none">
        <path d="M8 50 C 30 10, 60 10, 75 30" />
        <path d="M75 30 L 68 22 M75 30 L 82 26" />
      </svg>
    );
  }

  if (kind === "zigzag") {
    return (
      <svg viewBox="0 0 100 40" aria-hidden="true" preserveAspectRatio="none">
        <path d="M2 18 L 15 8 L 28 24 L 41 8 L 54 24 L 67 8 L 80 24 L 93 8 L 98 18" />
      </svg>
    );
  }

  if (kind === "star-scribble") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 8 L 62 38 L 94 43 L 69 63 L 75 93 L 50 77 L 25 93 L 31 63 L 6 43 L 38 38 Z" />
      </svg>
    );
  }

  if (kind === "highlight") {
    return (
      <svg viewBox="0 0 100 40" aria-hidden="true">
        <rect x="3" y="8" width="94" height="24" rx="4" opacity="0.35" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "heart") {
    return (
      <svg viewBox="0 0 100 90" aria-hidden="true">
        <path d="M50 82 C 50 82, 8 55, 8 32 C 8 14, 20 8, 32 12 C 40 14, 48 22, 50 32 C 52 22, 60 14, 68 12 C 80 8, 92 14, 92 32 C 92 55, 50 82, 50 82 Z" />
      </svg>
    );
  }

  if (kind === "squiggle") {
    return (
      <svg viewBox="0 0 100 30" aria-hidden="true" preserveAspectRatio="none">
        <path d="M3 15 Q 15 5, 27 15 T 51 15 T 75 15 T 97 15" />
      </svg>
    );
  }

  if (kind === "double-underline") {
    return (
      <svg viewBox="0 0 100 40" aria-hidden="true" preserveAspectRatio="none">
        <path d="M3 14 Q 20 24, 35 14 T 65 14 T 97 14" />
        <path d="M3 24 Q 20 34, 35 24 T 65 24 T 97 24" />
      </svg>
    );
  }

  if (kind === "dot-circle") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" strokeDasharray="4 6" />
      </svg>
    );
  }

  if (kind === "oval") {
    return (
      <svg viewBox="0 0 100 60" aria-hidden="true" preserveAspectRatio="none">
        <path d="M10 30 C 10 8, 90 8, 90 30 C 90 52, 10 52, 10 30 Z" />
      </svg>
    );
  }

  if (kind === "paint-streak") {
    return (
      <svg viewBox="0 0 100 40" aria-hidden="true" preserveAspectRatio="none">
        <path d="M3 14 Q 18 6, 33 14 T 63 14 T 93 14" opacity="0.5" strokeWidth="8" />
        <path d="M6 22 Q 22 8, 36 22 T 64 22 T 91 22" opacity="0.7" strokeWidth="5" />
      </svg>
    );
  }

  if (kind === "cross-out") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M12 12 L 88 88" />
        <path d="M88 12 L 12 88" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 130" aria-hidden="true">
      <path d="M5 5h90v120H5z" />
      <path d="M5 31h90M26 5v120M50 5v120M74 5v120" />
    </svg>
  );
}

function getDefaultTextBox(format: Format): Box {
  if (format === "mobile") return { x: 8, y: 30, w: 84, h: 24 };
  if (format === "square") return { x: 10, y: 34, w: 80, h: 22 };
  return { x: 7, y: 34, w: 56, h: 28 };
}

function getDefaultMediaBox(format: Format): Box {
  if (format === "mobile") return { x: 53, y: 66, w: 42, h: 28 };
  if (format === "square") return { x: 26, y: 62, w: 48, h: 28 };
  return { x: 71, y: 60, w: 25, h: 34 };
}

function startDrag(
  event: React.PointerEvent<HTMLElement>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  onMove: (point: Point) => void,
  onDragEnd?: () => void,
) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);

  const update = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    onMove({
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 96),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 96),
    });
  };

  update(event.clientX, event.clientY);

  const move = (moveEvent: PointerEvent) => update(moveEvent.clientX, moveEvent.clientY);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    onDragEnd?.();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startBoxMove(
  event: React.PointerEvent<HTMLElement>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  box: Box,
  onMove: (box: Box) => void,
  onDragEnd?: () => void,
) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);

  const rect = canvas.getBoundingClientRect();
  const startX = ((event.clientX - rect.left) / rect.width) * 100;
  const startY = ((event.clientY - rect.top) / rect.height) * 100;
  const offsetX = startX - box.x;
  const offsetY = startY - box.y;

  const update = (clientX: number, clientY: number) => {
    const nextX = ((clientX - rect.left) / rect.width) * 100 - offsetX;
    const nextY = ((clientY - rect.top) / rect.height) * 100 - offsetY;
    onMove({
      ...box,
      x: clamp(nextX, 0, 100 - box.w),
      y: clamp(nextY, 0, 100 - box.h),
    });
  };

  const move = (moveEvent: PointerEvent) => update(moveEvent.clientX, moveEvent.clientY);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startBoxResize(
  event: React.PointerEvent<HTMLElement>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  box: Box,
  onResize: (box: Box) => void,
  handle: ResizeHandle,
  limits: { minW: number; minH: number; maxW: number; maxH: number },
  onDragEnd?: () => void,
) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);

  const rect = canvas.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;

  const update = (clientX: number, clientY: number) => {
    const deltaX = ((clientX - startX) / rect.width) * 100;
    const deltaY = ((clientY - startY) / rect.height) * 100;
    const movesWest = handle.includes("w");
    const movesEast = handle.includes("e");
    const movesNorth = handle.includes("n");
    const movesSouth = handle.includes("s");
    const requestedW = movesWest ? box.w - deltaX : movesEast ? box.w + deltaX : box.w;
    const requestedH = movesNorth ? box.h - deltaY : movesSouth ? box.h + deltaY : box.h;
    const maxW = movesWest
      ? Math.min(limits.maxW, box.x + box.w)
      : Math.min(limits.maxW, 100 - box.x);
    const maxH = movesNorth
      ? Math.min(limits.maxH, box.y + box.h)
      : Math.min(limits.maxH, 100 - box.y);
    const nextW = clamp(requestedW, limits.minW, maxW);
    const nextH = clamp(requestedH, limits.minH, maxH);

    onResize({
      ...box,
      x: movesWest ? clamp(box.x + (box.w - nextW), 0, box.x + box.w - limits.minW) : box.x,
      y: movesNorth ? clamp(box.y + (box.h - nextH), 0, box.y + box.h - limits.minH) : box.y,
      w: nextW,
      h: nextH,
    });
  };

  const move = (moveEvent: PointerEvent) => update(moveEvent.clientX, moveEvent.clientY);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    onDragEnd?.();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startAssetResize(
  event: React.PointerEvent<HTMLElement>,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  asset: PlacedDecoration,
  onResize: (size: number) => void,
  onDragEnd?: () => void,
) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);

  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + (asset.x / 100) * rect.width;
  const centerY = rect.top + (asset.y / 100) * rect.height;
  const startDistance = Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY));
  const startSize = asset.size;

  const move = (moveEvent: PointerEvent) => {
    const nextDistance = Math.max(
      1,
      Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY),
    );
    onResize(startSize * (nextDistance / startDistance));
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    onDragEnd?.();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function makeTextLines(text: string, format: Format): string[] {
  if (!text) return [];

  const maxChars = format === "mobile" ? 9 : format === "square" ? 13 : 15;
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      return;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, format === "mobile" ? 4 : 3);
}

function getTextStyle(
  format: Format,
  lines: string[],
  previewSize: { width: number; height: number },
  textBox: Box,
  font: FontOption,
  fontWeight: FontWeight,
  fontSizeScale: number,
  lineSpacing: number,
  letterSpacing: number,
  textColor: string,
): React.CSSProperties {
  const width = previewSize.width || (format === "mobile" ? 360 : format === "square" ? 540 : 960);
  const height =
    previewSize.height || (format === "mobile" ? 640 : format === "square" ? 540 : 540);
  const isMobile = format === "mobile";
  const isSquare = format === "square";
  const align = isMobile || isSquare ? "center" : "left";

  const longest = Math.max(...lines.map((line) => line.length), 1);
  const lineCount = Math.max(lines.length, 1);
  const lineHeight = lineSpacing;
  const boxW = width * (textBox.w / 100);
  const boxH = height * (textBox.h / 100);
  const maxFont = width * (isMobile ? 0.13 : isSquare ? 0.11 : 0.092);
  const byWidth = boxW / (longest * font.ratio);
  const byHeight = boxH / (lineCount * lineHeight);
  const fontSize = Math.max(18, Math.min(maxFont, byWidth, byHeight) * (fontSizeScale / 100));
  const fontSizePercent = (fontSize / width) * 100;
  const x = clamp(textBox.x, 0, 100 - textBox.w);
  const y = clamp(textBox.y, 0, 100 - textBox.h);

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${textBox.w}%`,
    fontFamily: font.family,
    fontWeight,
    fontSize: `${fontSizePercent}cqw`,
    lineHeight,
    letterSpacing: `${letterSpacing}em`,
    color: textColor,
    textAlign: align,
    transform: "translateZ(0)",
  };
}

function getTextPalette(bg: BackgroundOption): ColorOption[] {
  const set = new Set<string>([
    bg.ink,
    bg.mediaInk,
    "#050505",
    "#1f2020",
    "#434545",
    "#b9b6ae",
    "#e8e9e6",
    "#f2f2ef",
  ]);
  const cleaned = [...set].filter((value) => value.toLowerCase() !== bg.value.toLowerCase());
  return cleaned.slice(0, 8).map((value, i) => ({ label: `tone-${i + 1}`, value }));
}

function renderTextWithHighlight(
  lines: string[],
  highlightedWordIndex: number | null,
  highlightColor: string,
) {
  let tokenIndex = 0;
  return lines.map((line, lineIndex) => {
    const words = line.split(" ").filter(Boolean);
    return (
      <span key={`line-${lineIndex}`} className="block">
        {words.map((word, wordIndex) => {
          const current = tokenIndex++;
          const isHighlighted = highlightedWordIndex === current;
          return (
            <span
              key={`${word}-${lineIndex}-${wordIndex}`}
              style={
                isHighlighted
                  ? {
                      color: highlightColor,
                      fontWeight: 900,
                      textDecoration: "underline",
                      textDecorationThickness: "0.06em",
                      textUnderlineOffset: "0.08em",
                    }
                  : undefined
              }
            >
              {word}
              {wordIndex < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    );
  });
}

interface TenorResult {
  id?: string;
  content_description?: string;
  media_formats?: {
    gif?: { url?: string };
    tinygif?: { url?: string };
  };
}

interface TenorLegacyResult {
  id?: string;
  title?: string;
  media?: Array<{
    gif?: { url?: string };
    tinygif?: { url?: string };
  }>;
}

async function processMediaFile(
  file: File,
  bg: BackgroundOption,
  mediaMode: MediaMode,
  removeBg: boolean,
): Promise<string> {
  try {
    if (mediaMode === "monochrome") {
      return await ditherImage(file, bg.value, bg.mediaInk, removeBg);
    }
    if (removeBg) {
      return await removeImageBackground(file);
    }
    return readFile(file);
  } catch {
    return readFile(file);
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function toDataUrlSafe(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return url;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return url;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function ditherImage(
  file: File,
  bgColor: string,
  inkColor: string,
  removeBg: boolean,
): Promise<string> {
  const source = await readFile(file);
  const image = await loadImage(source);
  const maxW = 520;
  const scale = Math.min(1, maxW / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  if (removeBg) removeBackgroundPixels(data, width, height);
  const luminance = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    luminance[i] = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const oldValue = luminance[index];
      const nextValue = oldValue < 142 ? 0 : 255;
      const error = oldValue - nextValue;
      luminance[index] = nextValue;
      spreadDither(luminance, width, height, x + 1, y, error * (7 / 16));
      spreadDither(luminance, width, height, x - 1, y + 1, error * (3 / 16));
      spreadDither(luminance, width, height, x, y + 1, error * (5 / 16));
      spreadDither(luminance, width, height, x + 1, y + 1, error * (1 / 16));
    }
  }

  const bg = hexToRgb(bgColor);
  const ink = hexToRgb(inkColor);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const useInk = luminance[i] < 128;
    const color = useInk ? ink : bg;
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = useInk ? 255 : 0;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

async function removeImageBackground(file: File): Promise<string> {
  const source = await readFile(file);
  const image = await loadImage(source);
  const maxW = 900;
  const scale = Math.min(1, maxW / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  removeBackgroundPixels(imageData.data, width, height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function removeBackgroundPixels(data: Uint8ClampedArray, width: number, height: number) {
  const sample = sampleCornerColor(data, width, height);
  const threshold = 42;

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const alpha = data[offset + 3];
    if (alpha < 16) continue;
    const distance = rgbDistance(data[offset], data[offset + 1], data[offset + 2], sample);
    if (distance <= threshold) {
      data[offset + 3] = 0;
    }
  }
}

function sampleCornerColor(data: Uint8ClampedArray, width: number, height: number) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ] as const;
  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of points) {
    const offset = (y * width + x) * 4;
    r += data[offset];
    g += data[offset + 1];
    b += data[offset + 2];
  }

  return { r: r / points.length, g: g / points.length, b: b / points.length };
}

function rgbDistance(r: number, g: number, b: number, target: { r: number; g: number; b: number }) {
  const dr = r - target.r;
  const dg = g - target.g;
  const db = b - target.b;
  return Math.hypot(dr, dg, db);
}

async function searchTenorGifs(query: string, signal?: AbortSignal): Promise<GifResult[]> {
  const v2Params = new URLSearchParams({
    q: query,
    key: TENOR_KEY,
    client_key: "wallposter",
    limit: "16",
    media_filter: "tinygif,gif",
    contentfilter: "medium",
  });
  const v2Url = `https://tenor.googleapis.com/v2/search?${v2Params.toString()}`;
  const primary = await fetch(v2Url, { signal });

  if (primary.ok) {
    const payload = (await primary.json()) as { results?: TenorResult[] };
    const results = mapTenorV2(payload.results ?? []);
    if (results.length > 0) return results;
  }

  const v1Params = new URLSearchParams({
    q: query,
    key: TENOR_KEY,
    limit: "16",
    media_filter: "minimal",
    contentfilter: "medium",
  });
  const v1Url = `https://g.tenor.com/v1/search?${v1Params.toString()}`;
  const fallback = await fetch(v1Url, { signal });
  if (!fallback.ok) {
    throw new Error(`tenor ${primary.status}/${fallback.status}`);
  }
  const legacyPayload = (await fallback.json()) as { results?: TenorLegacyResult[] };
  return mapTenorLegacy(legacyPayload.results ?? []);
}

function mapTenorV2(items: TenorResult[]): GifResult[] {
  return items
    .map((item, index) => {
      const full = item.media_formats?.gif?.url;
      const thumb = item.media_formats?.tinygif?.url || full;
      if (!full || !thumb) return null;
      return {
        id: item.id || `tenor-${index}`,
        title: item.content_description || "GIF",
        thumb,
        full,
      };
    })
    .filter(Boolean) as GifResult[];
}

function mapTenorLegacy(items: TenorLegacyResult[]): GifResult[] {
  return items
    .map((item, index) => {
      const first = item.media?.[0];
      const full = first?.gif?.url;
      const thumb = first?.tinygif?.url || full;
      if (!full || !thumb) return null;
      return {
        id: item.id || `tenor-legacy-${index}`,
        title: item.title || "GIF",
        thumb,
        full,
      };
    })
    .filter(Boolean) as GifResult[];
}

function spreadDither(
  pixels: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  value: number,
) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  pixels[y * width + x] += value;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function selectedElementLabel(selectedElement: SelectedElement): string {
  if (selectedElement === "text") return "Text selected";
  if (selectedElement === "media") return "Media selected";
  if (selectedElement?.startsWith("decoration:")) return "Asset selected";
  return "";
}
