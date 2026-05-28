import { Rnd } from "react-rnd";
import { useWallpaper, FORMAT_RATIOS } from "../store/wallpaper";
import { Scribble } from "./Scribble";
import { useRef, useEffect, useState } from "react";

interface Props {
  editable?: boolean;
  maxHeight?: number;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export function WallpaperCanvas({ editable = true, maxHeight = 720, canvasRef }: Props) {
  const { elements, bg, format, selectedId, select, updateElement } = useWallpaper();
  const ratio = FORMAT_RATIOS[format];
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 720 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const parentW = el.clientWidth;
      const parentH = maxHeight;
      const aspect = ratio.w / ratio.h;
      let w = parentW;
      let h = w / aspect;
      if (h > parentH) {
        h = parentH;
        w = h * aspect;
      }
      setSize({ w, h });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio, maxHeight]);

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center"
      style={{ minHeight: maxHeight }}
    >
      <div
        ref={canvasRef}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) select(null);
        }}
        className="relative overflow-hidden shadow-2xl paper-grain"
        style={{
          width: size.w,
          height: size.h,
          backgroundColor: bg,
          borderRadius: format === "phone" ? 28 : 8,
        }}
      >
        {elements
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((el) => {
            const px = {
              x: (el.x / 100) * size.w,
              y: (el.y / 100) * size.h,
              w: (el.w / 100) * size.w,
              h: (el.h / 100) * size.h,
            };
            const isSelected = selectedId === el.id;
            const content = renderElement(el, px.w, px.h);

            if (!editable) {
              return (
                <div
                  key={el.id}
                  style={{
                    position: "absolute",
                    left: px.x,
                    top: px.y,
                    width: px.w,
                    height: px.h,
                    transform: `rotate(${el.rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {content}
                </div>
              );
            }

            return (
              <Rnd
                key={el.id}
                size={{ width: px.w, height: px.h }}
                position={{ x: px.x, y: px.y }}
                bounds="parent"
                onMouseDown={() => select(el.id)}
                onDragStop={(_e, d) => {
                  updateElement(el.id, {
                    x: (d.x / size.w) * 100,
                    y: (d.y / size.h) * 100,
                  });
                }}
                onResizeStop={(_e, _dir, ref, _delta, pos) => {
                  updateElement(el.id, {
                    w: (ref.offsetWidth / size.w) * 100,
                    h: (ref.offsetHeight / size.h) * 100,
                    x: (pos.x / size.w) * 100,
                    y: (pos.y / size.h) * 100,
                  });
                }}
                style={{
                  outline: isSelected ? "2px dashed #ff5722" : "none",
                  outlineOffset: 2,
                  zIndex: el.z,
                }}
                enableResizing={
                  el.kind === "text" || el.kind === "emoji"
                    ? { bottomRight: true, right: true }
                    : true
                }
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `rotate(${el.rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {content}
                </div>
              </Rnd>
            );
          })}
      </div>
    </div>
  );
}

function glyphRatio(fontFamily?: string, fontWeight?: number): number {
  if (fontFamily === "Archivo Black") return 0.68;
  if (fontFamily === "Anton") return 0.58;
  if (fontFamily === "Montserrat") return fontWeight && fontWeight >= 900 ? 0.64 : 0.56;
  if (fontFamily === "Bricolage Grotesque") return fontWeight && fontWeight >= 700 ? 0.58 : 0.52;
  if (fontFamily === "Instrument Serif") return 0.5;
  if (fontFamily === "Playfair Display") return 0.52;
  if (fontFamily === "Space Grotesk") return 0.54;
  if (fontFamily === "Caveat") return 0.42;
  if (fontWeight && fontWeight >= 900) return 0.64;
  return 0.56;
}

function fitTextToBox(
  text: string,
  boxW: number,
  boxH: number,
  ratio: number,
  letterSpacing: number | undefined,
  lineHeight: number | undefined,
): number {
  if (!text || boxW <= 0 || boxH <= 0) return boxH * 0.8;

  const lh = lineHeight ?? 1.0;
  const ls = letterSpacing ?? 0;
  const usableW = boxW * 0.9;
  const usableH = boxH * 0.96;

  // Decompose text into words, tracking forced \n breaks
  type WordEntry = { word: string; forceBreak: boolean };
  const entries: WordEntry[] = [];
  const segments = text.split("\n");
  for (let s = 0; s < segments.length; s++) {
    const segWords = segments[s].split(/\s+/).filter(Boolean);
    if (segWords.length === 0 && s < segments.length - 1) {
      // empty line (consecutive \n) — add a blank entry
      entries.push({ word: "", forceBreak: true });
      continue;
    }
    for (let w = 0; w < segWords.length; w++) {
      entries.push({ word: segWords[w], forceBreak: false });
    }
    // Mark the last word of each segment as forcing a break (except the last segment)
    if (s < segments.length - 1 && entries.length > 0) {
      entries[entries.length - 1].forceBreak = true;
    }
  }
  if (entries.length === 0) return Math.max(boxH * 0.8, 12);

  // Longest-word width check: maximum font where longest word fits in boxW
  const longestLen = entries.reduce((max, e) => (e.word.length > max ? e.word.length : max), 0);
  if (longestLen === 0) return Math.max(boxH * 0.8, 12);

  // Upper bound: longest word must fit width at this font size
  // Width of word = len * fs * ratio + (len-1) * ls
  // fs = (usableW - (len-1) * ls) / (len * ratio)
  const maxFontByWidth =
    longestLen * ratio > 0 ? (usableW - (longestLen - 1) * ls) / (longestLen * ratio) : boxH * 2;

  let lo = 8;
  let hi = Math.min(boxH * 2, Math.max(maxFontByWidth, 8));
  let best = lo;

  // Safety: if hi is unreasonably large, cap it
  if (hi > boxH * 3) hi = boxH * 3;

  for (let iter = 0; iter < 20; iter++) {
    const fs = (lo + hi) / 2;
    const glyphW = fs * ratio;
    const spaceW = glyphW * 0.3;

    // Check longest word fits at this font size
    const widestW = longestLen * glyphW + (longestLen - 1) * ls;
    if (widestW > usableW) {
      hi = fs;
      continue;
    }

    // Simulate line wrapping
    let lines = 1;
    let curW = 0;

    for (const { word, forceBreak } of entries) {
      if (word.length === 0) {
        if (forceBreak) {
          lines++;
          curW = 0;
        }
        continue;
      }
      const wordW = word.length * glyphW + (word.length - 1) * ls;
      const gap = curW > 0 ? spaceW : 0;

      if (forceBreak && curW > 0) {
        lines++;
        curW = wordW;
      } else if (curW + gap + wordW > usableW) {
        lines++;
        curW = wordW;
        if (wordW > usableW) {
          // single word wider than box → font too big
          hi = fs;
          continue;
        }
      } else {
        curW += gap + wordW;
      }
    }

    const totalH = lines * fs * lh;
    if (totalH <= usableH) {
      best = fs;
      lo = fs;
    } else {
      hi = fs;
    }
  }

  return Math.max(best, 8);
}

function renderElement(
  el: ReturnType<typeof useWallpaper.getState>["elements"][0],
  pxW: number,
  pxH: number,
) {
  if (el.kind === "text" || el.kind === "emoji") {
    const text = el.text ?? "";
    const isEmoji = el.kind === "emoji";

    const fontSize = isEmoji
      ? Math.min(pxH * 0.8, pxW * 0.8)
      : fitTextToBox(
          text,
          pxW * 0.94,
          pxH * 0.98,
          glyphRatio(el.fontFamily, el.fontWeight),
          el.letterSpacing,
          el.lineHeight,
        );

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          padding: isEmoji ? 0 : "0 3%",
          display: "flex",
          alignItems: "center",
          justifyContent:
            el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
          fontFamily: el.fontFamily,
          fontWeight: el.fontWeight,
          fontStyle: el.italic ? "italic" : "normal",
          color: el.color,
          fontSize,
          lineHeight: el.lineHeight,
          letterSpacing: el.letterSpacing,
          textAlign: el.align,
          whiteSpace: "pre-line",
          overflow: "hidden",
          wordBreak: "normal",
          overflowWrap: "break-word",
          textWrap: "balance",
          userSelect: "none",
        }}
      >
        {el.text}
      </div>
    );
  }
  if (el.kind === "image" && el.src) {
    const isVideo = /\.(mp4|webm|mov)(\?|#|$)/i.test(el.src);
    if (isVideo) {
      return (
        <video
          src={el.src}
          autoPlay
          muted
          loop
          playsInline
          crossOrigin="anonymous"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
            borderRadius: "7%",
            filter: "contrast(1.04) saturate(0.96)",
          }}
        />
      );
    }
    return (
      <img
        src={el.src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
          borderRadius: "7%",
          filter: "contrast(1.04) saturate(0.96)",
        }}
      />
    );
  }
  if (el.kind === "scribble" && el.scribble) {
    return <Scribble variant={el.scribble} color={el.stroke} width={el.strokeWidth} />;
  }
  if (el.kind === "shape" && el.shape) {
    const fill = el.fill ?? "#ffffff";
    if (el.shape === "ring") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `max(2px, ${Math.min(pxW, pxH) * 0.06}px) solid ${fill}`,
            borderRadius: "999px",
            opacity: 0.9,
          }}
        />
      );
    }
    if (el.shape === "dot") {
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: "999px", background: fill }} />
      );
    }
    if (el.shape === "square") {
      return <div style={{ width: "100%", height: "100%", borderRadius: 10, background: fill }} />;
    }
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: fill,
          borderRadius: "34% 66% 58% 42% / 45% 39% 61% 55%",
          boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
        }}
      />
    );
  }
  return null;
}
