export type Point = { x: number; y: number };
export type Box = Point & { w: number; h: number };

export type FontWeight = 400 | 700 | 900;

export type FontOption = {
  label: string;
  family: string;
  ratio: number;
};

export type DecorationKind =
  | "frame"
  | "target"
  | "ruler"
  | "spark"
  | "caption"
  | "underline"
  | "circle"
  | "arrow"
  | "zigzag"
  | "star-scribble"
  | "highlight"
  | "heart"
  | "squiggle"
  | "double-underline"
  | "dot-circle"
  | "oval"
  | "paint-streak"
  | "cross-out";
