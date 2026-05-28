import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  useWallpaper,
  uid,
  type CanvasElement,
  type ScribbleVariant,
  FORMAT_RATIOS,
  type CanvasFormat,
} from "../store/wallpaper";
import { WallpaperCanvas } from "../components/WallpaperCanvas";
import { generateLayout, PALETTES, FONTS, EMOJIS } from "../lib/templates";
import { ArrowLeft, Download, Shuffle, Plus, Trash2, Layers, Wand2 } from "lucide-react";

export const Route = createFileRoute("/edit")({
  head: () => ({ meta: [{ title: "Make it yours — posterwall" }] }),
  ssr: false,
  component: Edit,
});

function Edit() {
  const navigate = useNavigate();
  const {
    prompt,
    elements,
    selectedId,
    updateElement,
    addElement,
    removeElement,
    select,
    bg,
    setBg,
    format,
    setFormat,
    imageSrc,
    setElements,
  } = useWallpaper();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);

  useEffect(() => {
    if (!prompt) navigate({ to: "/" });
  }, [prompt, navigate]);

  const selected = elements.find((e) => e.id === selectedId) || null;

  async function exportPng() {
    if (!canvasRef.current) return;
    select(null);
    await new Promise((r) => setTimeout(r, 50));
    const ratio = FORMAT_RATIOS[format];
    const targetW = format === "phone" ? 1170 : format === "desktop" ? 1920 : 1500;
    const targetH = Math.round((targetW * ratio.h) / ratio.w);
    const node = canvasRef.current;
    const scale = targetW / node.offsetWidth;
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: scale,
        width: node.offsetWidth,
        height: node.offsetHeight,
      });
      const link = document.createElement("a");
      link.download = `posterwall-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Export failed — try removing the image and exporting just the typography.");
    }
  }

  function regenerate() {
    const layout = generateLayout(prompt, imageSrc, format);
    setBg(layout.bg);
    setElements(layout.elements);
    select(null);
  }

  function changeFormat(nextFormat: CanvasFormat) {
    setFormat(nextFormat);
    const layout = generateLayout(prompt, imageSrc, nextFormat);
    setBg(layout.bg);
    setElements(layout.elements);
    select(null);
  }

  function addText() {
    const el: CanvasElement = {
      id: uid(),
      kind: "text",
      x: 20,
      y: 45,
      w: 60,
      h: 10,
      rotation: 0,
      z: 20,
      text: "new text",
      fontFamily: "Archivo Black",
      fontWeight: 900,
      color: "#0a0a0a",
      align: "center",
      lineHeight: 1,
      letterSpacing: -1,
    };
    addElement(el);
  }

  function addEmoji(emoji: string) {
    addElement({
      id: uid(),
      kind: "emoji",
      x: 40,
      y: 40,
      w: 12,
      h: 10,
      rotation: 0,
      z: 25,
      text: emoji,
      fontFamily: "Inter",
      fontWeight: 700,
      color: "#0a0a0a",
      align: "center",
      lineHeight: 1,
    });
  }

  function addScribble(variant: ScribbleVariant) {
    addElement({
      id: uid(),
      kind: "scribble",
      x: 20,
      y: 50,
      w: 25,
      h: 12,
      rotation: 0,
      z: 22,
      scribble: variant,
      stroke: "#ff5722",
      strokeWidth: 3,
    });
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/pick"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="hidden sm:block">
            <span className="font-logo text-lg tracking-tight text-foreground">posterwall</span>
          </div>
        </div>

        <div className="step-label hidden md:block">Step 3 of 3 — Make it yours</div>

        <div className="flex items-center gap-2">
          <button
            onClick={regenerate}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide border-2 border-border px-3 py-2 rounded-full hover:border-foreground/30 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
          <button
            onClick={exportPng}
            className="inline-flex items-center gap-2 bg-foreground text-background font-grotesk text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[280px_1fr_300px] gap-0">
        {/* Canvas — first on mobile */}
        <div className="order-1 lg:order-2 bg-[#e8e6e0] paper-grain p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
          <WallpaperCanvas editable canvasRef={canvasRef} maxHeight={720} />
        </div>

        {/* Left toolbar */}
        <aside className="order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-border bg-card/50 backdrop-blur-sm">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Tools & Layers
            </span>
            <span className="text-muted-foreground">{mobileToolsOpen ? "▲" : "▼"}</span>
          </button>

          <div
            className={`${mobileToolsOpen ? "block" : "hidden"} lg:block p-4 space-y-8 overflow-y-auto`}
          >
            <Section title="Format">
              <div className="flex gap-2">
                {(Object.keys(FORMAT_RATIOS) as CanvasFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => changeFormat(f)}
                    className={`flex-1 text-xs font-medium uppercase tracking-wide py-2.5 rounded-xl border-2 transition-all ${
                      format === f
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {FORMAT_RATIOS[f].label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Background">
              <div className="grid grid-cols-5 gap-2">
                {PALETTES.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setBg(p.bg)}
                    className={`aspect-square rounded-xl border-2 transition-all ${
                      bg === p.bg
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.bg }}
                    title={p.bg}
                  />
                ))}
              </div>
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="mt-3 w-full h-10 cursor-pointer rounded-xl border-2 border-border bg-transparent"
              />
            </Section>

            <Section title="Add">
              <button
                onClick={addText}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium border-2 border-border hover:border-foreground/30 px-4 py-2.5 rounded-xl mb-3 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Text
              </button>

              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Scribbles
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {(
                  [
                    "underline",
                    "circle",
                    "oval",
                    "arrow",
                    "zigzag",
                    "star",
                    "highlight",
                    "heart",
                    "squiggle",
                    "paint-streak",
                    "double-underline",
                    "dot-circle",
                    "cross-out",
                  ] as ScribbleVariant[]
                ).map((v) => (
                  <button
                    key={v}
                    onClick={() => addScribble(v)}
                    className="text-[10px] font-medium uppercase border-2 border-border hover:border-foreground/30 py-2 rounded-xl transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Accents
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => addEmoji(e)}
                    className="aspect-square text-lg border-2 border-border hover:border-foreground/30 rounded-xl transition-colors flex items-center justify-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Layers">
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {[...elements].reverse().map((el) => (
                  <button
                    key={el.id}
                    onClick={() => select(el.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium truncate rounded-xl border-2 transition-all ${
                      selectedId === el.id
                        ? "border-foreground bg-foreground/5"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    {el.kind === "text" || el.kind === "emoji"
                      ? `T · ${el.text}`
                      : el.kind === "image"
                        ? "IMG"
                        : `~ ${el.scribble}`}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        </aside>

        {/* Right inspector */}
        <aside className="order-3 lg:order-3 border-t lg:border-t-0 lg:border-l border-border bg-card/50 backdrop-blur-sm">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileEditOpen(!mobileEditOpen)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Edit Selected
            </span>
            <span className="text-muted-foreground">{mobileEditOpen ? "▲" : "▼"}</span>
          </button>

          <div className={`${mobileEditOpen ? "block" : "hidden"} lg:block p-4 overflow-y-auto`}>
            {!selected ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Tap an element on the poster to edit it.
              </div>
            ) : (
              <Inspector
                element={selected}
                onChange={(p) => updateElement(selected.id, p)}
                onDelete={() => removeElement(selected.id)}
              />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Inspector({
  element,
  onChange,
  onDelete,
}: {
  element: CanvasElement;
  onChange: (p: Partial<CanvasElement>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="sticker-sm bg-secondary text-secondary-foreground capitalize">
          {element.kind}
        </span>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {(element.kind === "text" || element.kind === "emoji") && (
        <>
          <Field label="Text">
            <textarea
              value={element.text || ""}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={2}
              className="w-full text-sm border-2 border-border rounded-xl px-3 py-2 bg-transparent focus:border-ring focus:ring-2 focus:ring-ring outline-none transition-all resize-none"
            />
          </Field>
          {element.kind === "text" && (
            <Field label="Font">
              <select
                value={element.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
                className="w-full text-sm border-2 border-border rounded-xl px-3 py-2 bg-transparent focus:border-ring focus:ring-2 focus:ring-ring outline-none transition-all"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Color">
            <input
              type="color"
              value={element.color || "#000000"}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-full h-10 cursor-pointer rounded-xl border-2 border-border bg-transparent"
            />
          </Field>
          {element.kind === "text" && (
            <>
              <Field label="Align">
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => onChange({ align: a })}
                      className={`flex-1 text-[10px] font-bold uppercase py-2 rounded-xl border-2 transition-all ${
                        element.align === a
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Italic">
                <button
                  onClick={() => onChange({ italic: !element.italic })}
                  className={`text-xs font-medium px-4 py-2 rounded-xl border-2 transition-all ${
                    element.italic
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  {element.italic ? "On" : "Off"}
                </button>
              </Field>
            </>
          )}
        </>
      )}

      {element.kind === "scribble" && (
        <Field label="Color">
          <input
            type="color"
            value={element.stroke || "#ff5722"}
            onChange={(e) => onChange({ stroke: e.target.value })}
            className="w-full h-10 cursor-pointer rounded-xl border-2 border-border bg-transparent"
          />
        </Field>
      )}

      <Field label={`Rotation ${element.rotation.toFixed(0)}°`}>
        <input
          type="range"
          min={-45}
          max={45}
          value={element.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full accent-foreground"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
