#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distEntry = join(root, "dist", "cli", "index.js");
const srcEntry = join(root, "src", "cli", "index.ts");

if (existsSync(distEntry)) {
  await import(pathToFileURL(distEntry).href);
} else if (existsSync(srcEntry)) {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", srcEntry, ...process.argv.slice(2)],
    { stdio: "inherit", cwd: root, shell: process.platform === "win32" }
  );
  process.exit(result.status ?? 1);
} else {
  console.error("Candle AI is not built. Run: npm install && npm run build");
  process.exit(1);
}
