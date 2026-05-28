import type { ScribbleVariant } from "../store/wallpaper";

export function Scribble({
  variant,
  color = "#ff5722",
  width = 4,
}: {
  variant: ScribbleVariant;
  color?: string;
  width?: number;
}) {
  const common = {
    fill: "none" as const,
    stroke: color,
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (variant) {
    case "circle":
      return (
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M 50 5 C 80 5, 95 20, 95 30 C 95 45, 75 55, 50 55 C 25 55, 5 48, 5 30 C 5 15, 22 6, 50 6"
            {...common}
          />
        </svg>
      );
    case "underline":
      return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 3 18 Q 30 8, 55 14 T 97 12" {...common} />
          <path d="M 5 24 Q 35 20, 60 22 T 95 20" {...common} strokeWidth={width * 0.7} />
        </svg>
      );
    case "arrow":
      return (
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 5 30 Q 30 5, 55 30 T 90 30" {...common} />
          <path d="M 80 22 L 92 30 L 80 38" {...common} />
        </svg>
      );
    case "zigzag":
      return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 5 25 L 20 5 L 35 25 L 50 5 L 65 25 L 80 5 L 95 25" {...common} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <path
            d="M 30 5 L 35 25 L 55 30 L 35 35 L 30 55 L 25 35 L 5 30 L 25 25 Z"
            fill={color}
            stroke={color}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "highlight":
      return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <rect x="2" y="6" width="96" height="18" fill={color} opacity="0.35" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <path
            d="M 30 50 C 30 50, 5 35, 5 20 C 5 10, 12 5, 20 5 C 26 5, 30 10, 30 14 C 30 10, 34 5, 40 5 C 48 5, 55 10, 55 20 C 55 35, 30 50, 30 50 Z"
            fill={color}
            stroke={color}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "squiggle":
      return (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 5 30 Q 15 10, 25 25 T 45 20 T 65 28 T 85 15 T 97 25" {...common} />
        </svg>
      );
    case "double-underline":
      return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 3 12 Q 30 6, 55 10 T 97 8" {...common} />
          <path d="M 5 20 Q 35 16, 60 18 T 95 16" {...common} strokeWidth={width * 0.8} />
        </svg>
      );
    case "dot-circle":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth={width * 0.6}
            strokeDasharray="6 8"
          />
        </svg>
      );
    case "oval":
      return (
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
          <ellipse
            cx="50"
            cy="30"
            rx="45"
            ry="25"
            fill="none"
            stroke={color}
            strokeWidth={width * 0.8}
            strokeLinecap="round"
          />
        </svg>
      );
    case "paint-streak":
      return (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M 2 18 Q 15 5, 35 12 T 70 8 T 98 14"
            fill="none"
            stroke={color}
            strokeWidth={width * 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          <path
            d="M 8 28 Q 25 18, 45 22 T 80 16 T 96 24"
            fill="none"
            stroke={color}
            strokeWidth={width * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </svg>
      );
    case "cross-out":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <line
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            stroke={color}
            strokeWidth={width * 1.2}
            strokeLinecap="round"
          />
          <line
            x1="90"
            y1="10"
            x2="10"
            y2="90"
            stroke={color}
            strokeWidth={width * 1.2}
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
