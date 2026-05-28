import { create } from "zustand";

export type ElementKind = "text" | "image" | "emoji" | "scribble" | "shape";

export type ScribbleVariant =
  | "underline"
  | "circle"
  | "arrow"
  | "zigzag"
  | "star"
  | "highlight"
  | "heart"
  | "squiggle"
  | "double-underline"
  | "dot-circle"
  | "oval"
  | "paint-streak"
  | "cross-out";

export type ShapeVariant = "blob" | "dot" | "square" | "ring";

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number; // 0-100 percent of canvas width
  y: number; // 0-100 percent of canvas height
  w: number; // percent
  h: number; // percent
  rotation: number;
  z: number;
  // text fields
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  italic?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  // image
  src?: string;
  // scribble
  scribble?: ScribbleVariant;
  stroke?: string;
  strokeWidth?: number;
  // shape
  shape?: ShapeVariant;
  fill?: string;
  // emoji is just text
}

export type CanvasFormat = "phone" | "desktop" | "square";

export const FORMAT_RATIOS: Record<CanvasFormat, { w: number; h: number; label: string }> = {
  phone: { w: 9, h: 19.5, label: "Phone" },
  desktop: { w: 16, h: 10, label: "Desktop" },
  square: { w: 1, h: 1, label: "Square" },
};

interface WallpaperState {
  prompt: string;
  imageSrc: string | null;
  format: CanvasFormat;
  bg: string;
  elements: CanvasElement[];
  selectedId: string | null;
  setPrompt: (s: string) => void;
  setImage: (src: string | null) => void;
  setFormat: (f: CanvasFormat) => void;
  setBg: (c: string) => void;
  setElements: (els: CanvasElement[]) => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  select: (id: string | null) => void;
  reset: () => void;
}

export const useWallpaper = create<WallpaperState>((set) => ({
  prompt: "",
  imageSrc: null,
  format: "phone",
  bg: "#f5f1e8",
  elements: [],
  selectedId: null,
  setPrompt: (s) => set({ prompt: s }),
  setImage: (src) => set({ imageSrc: src }),
  setFormat: (f) => set({ format: f }),
  setBg: (c) => set({ bg: c }),
  setElements: (els) => set({ elements: els }),
  addElement: (el) => set((s) => ({ elements: [...s.elements, el], selectedId: el.id })),
  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  select: (id) => set({ selectedId: id }),
  reset: () =>
    set({
      prompt: "",
      imageSrc: null,
      elements: [],
      selectedId: null,
    }),
}));

export const uid = () => Math.random().toString(36).slice(2, 10);
