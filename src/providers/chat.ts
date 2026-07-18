import { spawn } from "node:child_process";
import { join } from "node:path";
import { PYTHON_DIR, getDesktopPath } from "../core/paths.js";
import {
  loadSecrets,
  loadUserConfig,
  type ApiProvider,
  type SearchProvider,
} from "../core/config.js";
import { PROVIDER_BASE_URLS, getModel } from "../core/models.js";
import type { ChatMessage } from "../core/sessions.js";
import { getAgent } from "../core/agents.js";

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  agentId: string;
  mode: "build" | "plan";
  userText: string;
}

export interface ChatResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: Array<{ name: string; result: string }>;
}

function estimateTokens(text: string): number {
  return Math.ceil((text || "").length / 4);
}

function runPython(args: string[], input?: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = join(PYTHON_DIR, "candle_engine", "main.py");
    const child = spawn("python", [script, ...args], {
      cwd: PYTHON_DIR,
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `Python exited ${code}`));
    });
    if (input) {
      child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

export async function searchWeb(query: string, provider?: SearchProvider): Promise<string> {
  const cfg = loadUserConfig();
  const p = provider ?? cfg?.searchProvider ?? "duckduckgo";
  try {
    return await runPython(["search", "--provider", p, "--query", query]);
  } catch {
    return `[search:${p}] Results for "${query}" (offline fallback)\n- Use a live provider key for full results.\n- Query recorded for agent context.`;
  }
}

export async function desktopListing(): Promise<string> {
  const desktop = getDesktopPath();
  try {
    return await runPython(["desktop", "--path", desktop]);
  } catch {
    return `Desktop path: ${desktop}`;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    return await runPython(["image", "--prompt", prompt]);
  } catch (e) {
    return `Image generation queued locally. Prompt: ${prompt}\n(${(e as Error).message})`;
  }
}

export async function elevenLabsSpeak(text: string): Promise<string> {
  const secrets = loadSecrets();
  if (!secrets.elevenLabsApiKey) {
    return "ElevenLabs is not configured. Run `candle setup` or use /elevenlabs to add your API key.";
  }
  try {
    return await runPython(["elevenlabs", "tts", "--text", text], {
      apiKey: secrets.elevenLabsApiKey,
    });
  } catch (e) {
    return `ElevenLabs error: ${(e as Error).message}`;
  }
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.4,
  };

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/Mcalrifle789/Candle-AI",
      "X-Title": "Candle AI",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Provider ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "(empty response)";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") ?? "(empty)";
}

function buildSystemPrompt(agentId: string, mode: "build" | "plan"): string {
  const agent = getAgent(agentId);
  const cfg = loadUserConfig();
  const desktop = getDesktopPath();
  const parts = [
    agent?.systemPrompt ?? "You are Candle AI, a terminal personal assistant.",
    `Active mode: ${mode}.`,
    `User: ${cfg?.username ?? "user"}.`,
    `Desktop access: ${cfg?.desktopAccess !== false ? "ENABLED" : "disabled"} (${desktop}).`,
    "Sessions are stored locally in the sessions/ folder. Deleted sessions cannot be recovered.",
    "You can use tools mentally: search web, read/write files, desktop access, image gen, ElevenLabs voice, create agents.",
    "Be concise in terminal output unless the user asks for detail.",
  ];
  return parts.join("\n");
}

export async function chatCompletion(req: ChatRequest): Promise<ChatResponse> {
  const cfg = loadUserConfig();
  const secrets = loadSecrets();
  const provider = (cfg?.apiProvider ?? "openrouter") as ApiProvider;
  const apiKey =
    secrets.providerKeys[provider] ||
    secrets.apiKey ||
    process.env.CANDLE_API_KEY ||
    "";
  const model = req.model || cfg?.defaultModel || "anthropic/claude-sonnet-4.6";
  const system = buildSystemPrompt(req.agentId, req.mode);
  const history = [...req.messages];
  if (!history.length || history[history.length - 1]?.content !== req.userText) {
    // caller usually already appended; keep as-is
  }

  const inputTokens = estimateTokens(system + history.map((m) => m.content).join("\n"));

  if (!apiKey) {
    const offline = offlineAssist(req.userText, req.mode, req.agentId);
    return {
      content: offline,
      inputTokens,
      outputTokens: estimateTokens(offline),
    };
  }

  try {
    let content: string;
    if (provider === "anthropic") {
      content = await callAnthropic(apiKey, model.replace(/^anthropic\//, ""), system, history);
    } else {
      const base =
        PROVIDER_BASE_URLS[provider] ||
        cfg?.customProviders?.find((p) => p.id === provider)?.baseUrl ||
        PROVIDER_BASE_URLS.openrouter;
      content = await callOpenAICompatible(base, apiKey, model, system, history);
    }
    return {
      content,
      inputTokens,
      outputTokens: estimateTokens(content),
    };
  } catch (e) {
    const msg = (e as Error).message;
    const fallback = `${offlineAssist(req.userText, req.mode, req.agentId)}\n\n[provider warning] ${msg}`;
    return {
      content: fallback,
      inputTokens,
      outputTokens: estimateTokens(fallback),
    };
  }
}

function offlineAssist(userText: string, mode: string, agentId: string): string {
  const lower = userText.toLowerCase();
  if (lower.startsWith("/")) {
    return `Acknowledged command context for ${userText}. Use the in-app slash menu for full skill routing.`;
  }
  return [
    `🕯️ Candle AI (${mode} · agent: ${agentId})`,
    "",
    "I received your message. No API key is active or the provider call failed, so I'm running in local assist mode.",
    "",
    `You said: "${userText.slice(0, 500)}"`,
    "",
    "Next steps:",
    "1. Run `candle setup` and add your provider API key",
    "2. Use `/model` to pick a model",
    "3. Use `/agent` to switch build/plan/custom agents",
    "4. Type `/` to browse all 48 skills",
    "",
    "Local sessions, desktop access, and agent files remain available offline.",
  ].join("\n");
}

export function resolveProviderKey(provider: string): string {
  const secrets = loadSecrets();
  return secrets.providerKeys[provider] || secrets.apiKey || "";
}

export { getModel };
