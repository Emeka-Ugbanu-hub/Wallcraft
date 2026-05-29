# Wallcraft

**Precision monochrome bitmap wallpaper creator.** Design brutalist, editorial, and dev-meme wallpapers for mobile, desktop, and square formats. One-click 4K export. Free, no sign-up.

**[Launch App →](https://emeka-ugbanu-hub.github.io/Wallcraft/)**

---

## Features

### Creative Packs
Curated design packs that transform your composition:
- **Brutalist UI** — Heavy industrial marks, Archivo Black typography, frame overlays
- **Editorial Marks** — Playfair Display serifs, Caveat script notes, refined underlines
- **Dev Meme** — Poster Condensed meme text, stars, hearts, and playful shapes
- **Minimal Mono** — Courier New monospace, dot grids, precise structural marks

### Layout Intents
Smart composition presets (not rigid templates):
- Poster Hero — Bold headline with accent mark
- Centered Manifesto — Everything centered and balanced
- Bottom Note — Image first, text anchored below
- Split Headline — Text and media side by side

### Production Tools
- **Undo/Redo** — Full history stack (Ctrl+Z / Ctrl+Shift+Z)
- **Lock/Unlock** — Prevent accidental drags (Ctrl+L)
- **Snap to Grid** — Precision alignment (G to toggle)
- **Safe Zone Checker** — Live warnings for clipping, edge proximity, and text size

### Export
- **3 Formats**: Mobile 4K (2160×3840), Desktop 4K (3840×2160), Square 4K (3840×3840)
- **Quality Tiers**: Lossless / High / Balanced JPEG compression
- **Export All** — One-click all three variants
- **Last Exported At** indicator

### Power Workflow
- **Save/Load** — `.wallcraft` project files with full state preservation
- **Keyboard Shortcuts** — Press `?` for the full cheatsheet overlay
- **Remix** — Shuffle decoration arrangement within your current pack

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start + TanStack Router |
| UI | React 19, shadcn/ui (Radix), Tailwind CSS 4 |
| State | React useState + custom undo/redo history |
| Export | html-to-image (Floyd-Steinberg dithering) |
| Icons | Lucide React |
| Fonts | Google Fonts (Archivo Black, Playfair Display, Caveat, Space Grotesk, +8 more) |

---

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Lint & format
bun run lint
bun run format
```

## Deployment

Deployed via GitHub Pages from the `docs/` directory on the `main` branch.

```bash
# Build and prepare docs/
bun run build
node scripts/deploy-github-pages.js
```

Then configure GitHub Pages in repo Settings → Pages → Source: `Deploy from a branch` → Branch: `main` → Folder: `/docs`.

---

## License

MIT
