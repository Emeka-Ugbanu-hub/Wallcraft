import { readdirSync, copyFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distClient = join(rootDir, "dist", "client");
const assetsDir = join(distClient, "assets");
const docsDir = join(rootDir, "docs");
const docsAssets = join(docsDir, "assets");

if (existsSync(docsDir)) {
  if (existsSync(docsAssets)) rmSync(docsAssets, { recursive: true });
} else {
  mkdirSync(docsDir, { recursive: true });
}
mkdirSync(docsAssets, { recursive: true });

const files = readdirSync(assetsDir);
const jsFiles = files.filter((f) => f.endsWith(".js"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

for (const f of files) {
  copyFileSync(join(assetsDir, f), join(docsAssets, f));
}

const scriptTags = jsFiles
  .map((f) => `<script type="module" crossorigin src="./assets/${f}"></script>`)
  .join("\n    ");

const linkTags = cssFiles
  .map((f) => `<link rel="stylesheet" crossorigin href="./assets/${f}">`)
  .join("\n    ");

const REPO_NAME = "Wallcraft";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="apple-touch-icon" href="./favicon.svg" />
    <link rel="manifest" href="./site.webmanifest" />
    <meta name="theme-color" content="#1f2020" />
    <meta name="color-scheme" content="dark light" />
    ${linkTags}
    <title>Wallcraft — Monochrome Bitmap Wallpaper Creator</title>
    <meta name="description" content="Wallcraft is a precision monochrome bitmap wallpaper creator. Design brutalist, editorial, and dev-meme wallpapers for mobile, desktop, and square formats. Export at 4K with one click." />
    <meta name="keywords" content="wallpaper creator, bitmap wallpaper, monochrome, poster design, brutalist, editorial, wallpaper maker, 4K wallpaper, mobile wallpaper, desktop wallpaper" />
    <meta name="author" content="Wallcraft" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://emeka-ugbanu-hub.github.io/${REPO_NAME}/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Wallcraft" />
    <meta property="og:title" content="Wallcraft — Precision Monochrome Wallpaper Creator" />
    <meta property="og:description" content="Design brutalist, editorial, and dev-meme wallpapers for mobile, desktop, and square. One-click 4K export. Free, no sign-up." />
    <meta property="og:url" content="https://emeka-ugbanu-hub.github.io/${REPO_NAME}/" />
    <meta property="og:image" content="https://emeka-ugbanu-hub.github.io/${REPO_NAME}/og-image.svg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Wallcraft — Monochrome Bitmap Wallpaper Creator interface showing a canvas preview with editorial typography and geometric decorations" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@wallcraft_app" />
    <meta name="twitter:title" content="Wallcraft — Monochrome Bitmap Wallpaper Creator" />
    <meta name="twitter:description" content="Design brutalist, editorial, and dev-meme wallpapers. Free, no sign-up. One-click 4K export." />
    <meta name="twitter:image" content="https://emeka-ugbanu-hub.github.io/${REPO_NAME}/og-image.svg" />
  </head>
  <body>
    <div id="root"></div>
    ${scriptTags}
  </body>
</html>
`;

writeFileSync(join(docsDir, "index.html"), html);

const notFound = html.replace(
  /<title>.*?<\/title>/,
  "<title>Wallcraft — Page Not Found</title>",
);

writeFileSync(join(docsDir, "404.html"), notFound);

console.log(`Deployed to docs/ with ${jsFiles.length} JS and ${cssFiles.length} CSS files`);
