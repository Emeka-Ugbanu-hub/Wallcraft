import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useWallpaper } from "../store/wallpaper";
import { generateLayout } from "../lib/templates";
import { ArrowRight, ArrowLeft, Shuffle, Search, Upload, Type } from "lucide-react";

interface GifResult {
  id: string;
  thumb: string;
  full: string;
  title: string;
}

interface RedditMediaChild {
  data?: {
    id?: string;
    thumbnail?: string;
    title?: string;
    url?: string;
  };
}

const GIF_SUBS = "gifs+reactiongifs+perfectloops+wholesomegifs+aww";

export const Route = createFileRoute("/pick")({
  head: () => ({ meta: [{ title: "Pick a vibe — posterwall" }] }),
  component: Pick,
});

function Pick() {
  const navigate = useNavigate();
  const { prompt, setImage, imageSrc, setElements, setBg, format } = useWallpaper();
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<string | null>(imageSrc);
  const [searchTerm, setSearchTerm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!prompt) navigate({ to: "/" });
  }, [prompt, navigate]);

  async function searchGifs(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${GIF_SUBS}/search.json?q=${encodeURIComponent(q)}&limit=12&restrict_sr=on&sort=relevance`,
      );
      const data = await res.json();
      const children = (data?.data?.children || []) as RedditMediaChild[];
      const items: GifResult[] = children
        .filter((c) => {
          const url = c.data?.url || "";
          if (!url) return false;
          if (url.includes("gfycat")) return false;
          if (url.includes("v.redd.it")) return false;
          return /\.(gif|gifv|jpe?g|png|webp)$/i.test(url) || url.includes("imgur");
        })
        .map((c, i) => {
          const d = c.data ?? {};
          let fullUrl = d.url || "";
          if (fullUrl.endsWith(".gifv")) fullUrl = fullUrl.replace(/\.gifv$/, ".gif");
          const thumb = d.thumbnail || "";
          const isValidThumb = thumb.startsWith("http");
          return {
            id: d.id || String(i),
            thumb: isValidThumb ? thumb : fullUrl,
            full: fullUrl,
            title: d.title || "",
          };
        });
      setGifs(items);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchGifs(prompt);
  }, [prompt]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setChosen(reader.result as string);
    reader.readAsDataURL(f);
  }

  function proceed(withImage: string | null) {
    setImage(withImage);
    const layout = generateLayout(prompt, withImage, format);
    setBg(layout.bg);
    setElements(layout.elements);
    navigate({ to: "/edit" });
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-3xl flex items-center justify-between mb-6">
        <Link to="/" className="font-logo text-xl tracking-tight text-foreground">
          posterwall
        </Link>
        <div className="step-label">Step 2 of 3</div>
      </header>

      <section className="w-full max-w-3xl card-blob bg-card p-6 md:p-10">
        <div className="mb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>

        <h1 className="font-display text-3xl md:text-5xl leading-[1.1] text-foreground mb-4">
          Wanna add a photo?
        </h1>
        <p className="text-muted-foreground max-w-xl mb-8 text-base leading-relaxed">
          We picked GIFs that match the vibe of{" "}
          <span className="font-semibold text-foreground">"{prompt}"</span>. Upload your own, choose
          one below, or skip it.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer card-blob bg-transparent border-2 border-dashed border-border hover:border-foreground/30 p-8 flex flex-col items-center justify-center text-center min-h-[220px] transition-all hover:scale-[1.01]"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-accent-foreground" />
            </div>
            <div className="font-display text-xl md:text-2xl text-foreground">Upload your own</div>
            <div className="text-xs font-medium text-muted-foreground mt-2">
              jpg · png · gif · webp
            </div>
          </div>

          <button
            onClick={() => proceed(null)}
            className="card-blob bg-transparent border-2 border-border hover:border-foreground/30 p-8 flex flex-col items-center justify-center text-center min-h-[220px] transition-all hover:scale-[1.01]"
          >
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Type className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="font-display text-xl md:text-2xl text-foreground">Just typography</div>
            <div className="text-xs font-medium text-muted-foreground mt-2">Text-only poster</div>
          </button>
        </div>

        {chosen && (
          <div className="mb-10 card-blob bg-transparent border-2 border-border p-4 flex flex-col sm:flex-row items-center gap-4">
            <img src={chosen} alt="preview" className="w-24 h-24 object-cover rounded-2xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="font-display text-lg text-foreground">Looking good!</div>
              <div className="text-xs font-medium text-muted-foreground">
                We'll place this in your composition.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => proceed(chosen)}
                className="bg-foreground text-background font-grotesk text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-foreground/90 transition-colors"
              >
                Use this
              </button>
              <button
                onClick={() => setChosen(null)}
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-3 py-2"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            We found these for you
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            Matching: <span className="highlight-text text-xl md:text-2xl">{prompt}</span>
          </h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchGifs(searchTerm || prompt);
                }}
                placeholder="Search for something else..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border-2 border-border bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40"
              />
            </div>
            <button
              onClick={() => searchGifs(searchTerm || prompt)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent text-accent-foreground px-4 py-2.5 rounded-full hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
            <button
              onClick={() => searchGifs(prompt)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide border-2 border-border px-4 py-2 rounded-full hover:border-foreground/30 disabled:opacity-50 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-border/50 animate-pulse rounded-2xl" />
              ))
            : gifs.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setChosen(g.full)}
                  className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                    chosen === g.full
                      ? "border-foreground scale-[1.02]"
                      : "border-transparent hover:border-foreground/20"
                  }`}
                >
                  <img
                    src={g.thumb}
                    alt={g.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {chosen === g.full && (
                    <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center rounded-2xl">
                      <span className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                        ✓
                      </span>
                    </div>
                  )}
                </button>
              ))}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={() => proceed(chosen)}
            className="group inline-flex items-center gap-2 bg-foreground text-background font-grotesk text-base font-semibold px-6 py-3 rounded-full hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            {chosen ? "Use this image" : "Skip & continue"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <footer className="mt-8 text-xs font-medium text-muted-foreground/80 text-center">
        You're doing great — almost there!
      </footer>
    </main>
  );
}
