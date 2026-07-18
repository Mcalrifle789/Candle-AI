import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_ROOT = join(__dirname, "..", "..");
export const CONFIG_DIR = join(APP_ROOT, "config");
export const SESSIONS_DIR = join(APP_ROOT, "sessions");
export const AGENTS_DIR = join(APP_ROOT, "agents");
export const CUSTOM_AGENTS_DIR = join(AGENTS_DIR, "custom");
export const ASSETS_DIR = join(APP_ROOT, "assets");
export const PYTHON_DIR = join(APP_ROOT, "python");
export const USER_CONFIG_PATH = join(CONFIG_DIR, "user.json");
export const SECRETS_PATH = join(CONFIG_DIR, "secrets.json");
export const MODELS_PATH = join(CONFIG_DIR, "models.json");

export function ensureAppDirs(): void {
  for (const dir of [CONFIG_DIR, SESSIONS_DIR, AGENTS_DIR, CUSTOM_AGENTS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

export function getDesktopPath(): string {
  const home = homedir();
  if (platform() === "win32") {
    return join(home, "Desktop");
  }
  if (platform() === "darwin") {
    return join(home, "Desktop");
  }
  return join(home, "Desktop");
}

export const BRAND = {
  name: "Candle AI",
  tagline: "Light up the way for your ideas",
  gold: "#FFD700",
  cyan: "#00E5FF",
  green: "#3DDC84",
  muted: "#8A8A8A",
  bg: "#0A0A0A",
} as const;
