import type { ApiProvider } from "./config.js";
import { loadCustomModels, type CustomModel } from "./config.js";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  isCustom?: boolean;
}

export const PROVIDER_MODELS: Record<string, ModelInfo[]> = {
  openrouter: [
    { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", provider: "openrouter", contextWindow: 200000, supportsTools: true },
    { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", provider: "openrouter", contextWindow: 200000, supportsTools: true },
    { id: "openai/gpt-4.1", name: "GPT-4.1", provider: "openrouter", contextWindow: 128000, supportsTools: true },
    { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openrouter", contextWindow: 128000, supportsTools: true },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "openrouter", contextWindow: 1000000, supportsTools: true, supportsVision: true },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "openrouter", contextWindow: 1000000, supportsTools: true },
    { id: "x-ai/grok-3", name: "Grok 3", provider: "openrouter", contextWindow: 131072, supportsTools: true },
    { id: "moonshotai/kimi-k2", name: "Kimi K2", provider: "openrouter", contextWindow: 128000, supportsTools: true },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", provider: "openrouter", contextWindow: 128000, supportsTools: true },
  ],
  openai: [
    { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", contextWindow: 128000, supportsTools: true },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai", contextWindow: 128000, supportsTools: true },
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", contextWindow: 128000, supportsTools: true, supportsVision: true },
    { id: "o3", name: "o3", provider: "openai", contextWindow: 200000, supportsTools: true },
    { id: "o4-mini", name: "o4-mini", provider: "openai", contextWindow: 200000, supportsTools: true },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", contextWindow: 200000, supportsTools: true },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic", contextWindow: 200000, supportsTools: true },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", contextWindow: 200000, supportsTools: true },
  ],
  grok: [
    { id: "grok-3", name: "Grok 3", provider: "grok", contextWindow: 131072, supportsTools: true },
    { id: "grok-3-mini", name: "Grok 3 Mini", provider: "grok", contextWindow: 131072, supportsTools: true },
    { id: "grok-2-vision", name: "Grok 2 Vision", provider: "grok", contextWindow: 32768, supportsVision: true },
  ],
  "google-gemini": [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google-gemini", contextWindow: 1000000, supportsTools: true, supportsVision: true },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google-gemini", contextWindow: 1000000, supportsTools: true },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google-gemini", contextWindow: 1000000, supportsTools: true },
  ],
  kimi: [
    { id: "moonshot-v1-128k", name: "Moonshot v1 128k", provider: "kimi", contextWindow: 128000, supportsTools: true },
    { id: "kimi-latest", name: "Kimi Latest", provider: "kimi", contextWindow: 128000, supportsTools: true },
  ],
  novita: [
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "novita", contextWindow: 128000, supportsTools: true },
    { id: "deepseek/deepseek-v3", name: "DeepSeek V3", provider: "novita", contextWindow: 128000, supportsTools: true },
    { id: "qwen/qwen3-235b", name: "Qwen3 235B", provider: "novita", contextWindow: 128000, supportsTools: true },
  ],
  "opencode-zen": [
    { id: "zen/default", name: "OpenCode Zen Default", provider: "opencode-zen", contextWindow: 200000, supportsTools: true },
    { id: "zen/fast", name: "OpenCode Zen Fast", provider: "opencode-zen", contextWindow: 128000, supportsTools: true },
  ],
  kilo: [
    { id: "kilo/default", name: "Kilo Default", provider: "kilo", contextWindow: 128000, supportsTools: true },
    { id: "kilo/code", name: "Kilo Code", provider: "kilo", contextWindow: 128000, supportsTools: true },
  ],
  custom: [],
};

export const PROVIDER_BASE_URLS: Record<ApiProvider, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  grok: "https://api.x.ai/v1",
  "google-gemini": "https://generativelanguage.googleapis.com/v1beta",
  kimi: "https://api.moonshot.cn/v1",
  novita: "https://api.novita.ai/v3/openai",
  "opencode-zen": "https://opencode.ai/zen/v1",
  kilo: "https://api.kilo.ai/v1",
  custom: "",
};

export function listAllModels(activeProvider?: string): ModelInfo[] {
  const all: ModelInfo[] = [];
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    if (activeProvider && provider !== activeProvider && provider !== "custom") {
      // still include all providers in /model picker
    }
    all.push(...models);
  }
  const custom = loadCustomModels().map((m: CustomModel) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    contextWindow: m.contextWindow ?? 128000,
    isCustom: true,
    supportsTools: true,
  }));
  all.push(...custom);
  // de-dupe by id
  const seen = new Set<string>();
  return all.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function getModel(id: string): ModelInfo | undefined {
  return listAllModels().find((m) => m.id === id);
}
