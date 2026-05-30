import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";

const rootDir = join(import.meta.dirname, "..");
const docsDir = join(rootDir, "docs");
const docsAssets = join(docsDir, "assets");

if (existsSync(docsAssets)) rmSync(docsAssets, { recursive: true });

const { execSync } = await import("child_process");
execSync("npx vite build --config vite.spa.config.ts --mode production", {
  cwd: rootDir,
  stdio: "inherit",
});

const indexPath = join(docsDir, "index.html");
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, "utf-8");

  const notFound = html.replace(
    /<title>.*?<\/title>/,
    "<title>Wallcraft — Page Not Found</title>",
  );

  writeFileSync(join(docsDir, "404.html"), notFound);
}

console.log("Deployed to docs/");
