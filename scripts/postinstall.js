import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const d of ["sessions", "agents", "agents/custom", "config"]) {
  const p = join(root, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}
console.log("Candle AI directories ready.");
