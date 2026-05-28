import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useWallpaper, FORMAT_RATIOS, type CanvasFormat } from "../store/wallpaper";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Posterwall — let's make something fun" },
      {
        name: "description",
        content: "Turn a thought into a bold, playful wallpaper. Free and open source.",
      },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = [
  "we don't pitch",
  "ship fast",
  "built different",
  "touch grass",
  "stay weird",
  "log off",
];

const MAX_WORDS = 18;

function Index() {
  const navigate = useNavigate();
  const { prompt, setPrompt, format, setFormat } = useWallpaper();
  const [text, setText] = useState(prompt);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tooMany = wordCount > MAX_WORDS;

  function submit() {
    const v = text.trim();
    if (!v || tooMany) return;
    setPrompt(v);
    navigate({ to: "/pick" });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* Top nav */}
      <header className="w-full max-w-xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="font-logo text-2xl tracking-tight text-foreground">posterwall</span>
          <span className="sticker-sm bg-accent text-accent-foreground">open source</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          github ↗
        </a>
      </header>

      {/* Main card */}
      <section className="w-full max-w-xl card-blob bg-card p-6 md:p-10 flex flex-col items-center text-center">
        <div className="step-label mb-8">Step 1 of 3</div>

        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] text-foreground mb-4">
          Hey there!
          <br />
          What's on your mind?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-10 text-base leading-relaxed">
          Drop a short phrase, a manifesto, or a little flex. Up to eighteen words — we'll turn it
          into a wallpaper you'll actually love.
        </p>

        <div className="w-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="e.g. we don't pitch"
            rows={2}
            maxLength={120}
            className="w-full resize-none bg-transparent border-2 border-border rounded-2xl py-6 px-4 font-display text-2xl md:text-4xl text-center placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/40 focus:ring-0 transition-all"
          />
          <div className="flex items-center justify-between mt-3 px-1 text-xs font-medium text-muted-foreground">
            <span className={tooMany ? "text-destructive font-bold" : ""}>
              {wordCount}/{MAX_WORDS} words
            </span>
            <span className="hidden sm:inline">Press ⌘ + ↵ when ready</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {(Object.keys(FORMAT_RATIOS) as CanvasFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-full border-2 transition-all ${
                format === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {FORMAT_RATIOS[f].label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center w-full">
          <button
            onClick={submit}
            disabled={!text.trim() || tooMany}
            className="group inline-flex items-center gap-3 bg-foreground text-background font-grotesk text-lg md:text-xl font-semibold px-8 py-4 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg w-full md:w-auto justify-center"
          >
            <Sparkles className="w-5 h-5" />
            Let's go
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <footer className="mt-8 text-xs font-medium text-muted-foreground/80 text-center">
        Typography-first wallpapers, made with love.
      </footer>
    </main>
  );
}
