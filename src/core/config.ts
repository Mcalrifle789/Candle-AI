import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  ensureAppDirs,
  MODELS_PATH,
  SECRETS_PATH,
  USER_CONFIG_PATH,
} from "./paths.js";

export type ApiProvider =
  | "openrouter"
  | "opencode-zen"
  | "novita"
  | "openai"
  | "anthropic"
  | "grok"
  | "google-gemini"
  | "kimi"
  | "kilo"
  | "custom";

export type SearchProvider =
  | "duckduckgo"
  | "google-gemini"
  | "parallel"
  | "parallel-free"
  | "tavily"
  | "brave"
  | "bing"
  | "serper";

export interface UserConfig {
  username: string;
  passwordHash: string;
  salt: string;
  apiProvider: ApiProvider;
  searchProvider: SearchProvider;
  defaultModel: string;
  mode: "build" | "plan";
  activeAgent: string;
  desktopAccess: boolean;
  elevenLabsEnabled: boolean;
  setupComplete: boolean;
  customProviders: Array<{
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SecretsConfig {
  apiKey: string;
  providerKeys: Record<string, string>;
  elevenLabsApiKey: string;
  customModelKeys: Record<string, string>;
}

export interface CustomModel {
  id: string;
  name: string;
  provider: string;
  baseUrl?: string;
  contextWindow?: number;
}

const DEFAULT_USER: Omit<UserConfig, "passwordHash" | "salt" | "username"> = {
  apiProvider: "openrouter",
  searchProvider: "duckduckgo",
  defaultModel: "anthropic/claude-sonnet-4.6",
  mode: "build",
  activeAgent: "build",
  desktopAccess: true,
  elevenLabsEnabled: false,
  setupComplete: false,
  customProviders: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, cfg: UserConfig): boolean {
  const hash = hashPassword(password, cfg.salt);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(cfg.passwordHash, "hex"));
  } catch {
    return false;
  }
}

export function loadUserConfig(): UserConfig | null {
  ensureAppDirs();
  if (!existsSync(USER_CONFIG_PATH)) return null;
  return JSON.parse(readFileSync(USER_CONFIG_PATH, "utf-8")) as UserConfig;
}

export function saveUserConfig(cfg: UserConfig): void {
  ensureAppDirs();
  cfg.updatedAt = new Date().toISOString();
  writeFileSync(USER_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

export function createUserConfig(input: {
  username: string;
  password: string;
  apiProvider: ApiProvider;
  searchProvider: SearchProvider;
  defaultModel?: string;
}): UserConfig {
  const salt = randomBytes(16).toString("hex");
  const cfg: UserConfig = {
    ...DEFAULT_USER,
    username: input.username,
    passwordHash: hashPassword(input.password, salt),
    salt,
    apiProvider: input.apiProvider,
    searchProvider: input.searchProvider,
    defaultModel: input.defaultModel ?? DEFAULT_USER.defaultModel,
    setupComplete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveUserConfig(cfg);
  return cfg;
}

export function loadSecrets(): SecretsConfig {
  ensureAppDirs();
  if (!existsSync(SECRETS_PATH)) {
    return {
      apiKey: process.env.CANDLE_API_KEY ?? "",
      providerKeys: {},
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
      customModelKeys: {},
    };
  }
  return JSON.parse(readFileSync(SECRETS_PATH, "utf-8")) as SecretsConfig;
}

export function saveSecrets(secrets: SecretsConfig): void {
  ensureAppDirs();
  writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2), "utf-8");
}

export function loadCustomModels(): CustomModel[] {
  ensureAppDirs();
  if (!existsSync(MODELS_PATH)) return [];
  const data = JSON.parse(readFileSync(MODELS_PATH, "utf-8")) as { models: CustomModel[] };
  return data.models ?? [];
}

export function saveCustomModels(models: CustomModel[]): void {
  ensureAppDirs();
  writeFileSync(MODELS_PATH, JSON.stringify({ models }, null, 2), "utf-8");
}

export function isSetupComplete(): boolean {
  const cfg = loadUserConfig();
  return Boolean(cfg?.setupComplete);
}

export function fingerprintKey(key: string): string {
  if (!key) return "(none)";
  return createHash("sha256").update(key).digest("hex").slice(0, 8);
}
