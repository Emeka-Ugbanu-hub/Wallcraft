import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
const BASE_URL = import.meta.env.BASE_URL || "/";
const ASSET = (path: string) => `${BASE_URL}${path}`.replace(/\/{2,}/g, "/");

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center card-blob bg-card p-8 md:p-12">
        <h1 className="text-6xl font-display text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Oops, lost?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page seems to have wandered off. Let's get you back on track.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center card-blob bg-card p-8 md:p-12">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Uh oh, something broke
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Don't worry — it's not your fault. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Wallcraft — Monochrome Bitmap Wallpaper Creator" },
      {
        name: "description",
        content: "Wallcraft is a precision monochrome bitmap wallpaper creator. Design brutalist, editorial, and dev-meme wallpapers for mobile, desktop, and square. One-click 4K export. Free, no sign-up.",
      },
      { name: "keywords", content: "wallpaper creator, bitmap wallpaper, monochrome, poster design, brutalist, editorial, wallpaper maker, 4K wallpaper, mobile wallpaper, desktop wallpaper" },
      { name: "author", content: "Wallcraft" },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: "#1f2020" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Wallcraft" },
      { property: "og:title", content: "Wallcraft — Precision Monochrome Wallpaper Creator" },
      { property: "og:description", content: "Design brutalist, editorial, and dev-meme wallpapers for mobile, desktop, and square. Free, no sign-up. One-click 4K export." },
      { property: "og:url", content: "https://emeka-ugbanu-hub.github.io/Wallcraft/" },
      { property: "og:image", content: "https://emeka-ugbanu-hub.github.io/Wallcraft/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Wallcraft — Monochrome Bitmap Wallpaper Creator" },
      { name: "twitter:description", content: "Design brutalist, editorial, and dev-meme wallpapers. Free, no sign-up. One-click 4K export." },
      { name: "twitter:image", content: "https://emeka-ugbanu-hub.github.io/Wallcraft/og-image.svg" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: ASSET("favicon.svg") },
      { rel: "apple-touch-icon", href: ASSET("favicon.svg") },
      { rel: "manifest", href: ASSET("site.webmanifest") },
      { rel: "canonical", href: "https://emeka-ugbanu-hub.github.io/Wallcraft/" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
