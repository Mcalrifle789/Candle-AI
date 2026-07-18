import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENTS_DIR, CUSTOM_AGENTS_DIR, ensureAppDirs } from "./paths.js";

export interface AgentDefinition {
  id: string;
  title: string;
  description: string;
  mode: "build" | "plan" | "custom";
  systemPrompt: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
  builtin: boolean;
}

export const BUILTIN_AGENTS: AgentDefinition[] = [
  {
    id: "build",
    title: "Build",
    description: "Execute tasks, write code, modify files, and complete work aggressively.",
    mode: "build",
    systemPrompt:
      "You are Candle AI in Build mode. Ship working results. Edit files, run commands, and complete the user's request with high agency. Prefer action over lengthy planning.",
    tools: ["*"],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    builtin: true,
  },
  {
    id: "plan",
    title: "Plan",
    description: "Research, design, and outline approaches before making changes.",
    mode: "plan",
    systemPrompt:
      "You are Candle AI in Plan mode. Think carefully. Explore the codebase, outline trade-offs, and produce a clear plan. Do not make destructive changes unless explicitly asked.",
    tools: ["read", "search", "list", "analyze"],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    builtin: true,
  },
];

function agentFile(id: string, custom = false): string {
  return join(custom ? CUSTOM_AGENTS_DIR : AGENTS_DIR, `${id}.json`);
}

export function ensureBuiltinAgents(): void {
  ensureAppDirs();
  for (const agent of BUILTIN_AGENTS) {
    const path = agentFile(agent.id, false);
    if (!existsSync(path)) {
      writeFileSync(path, JSON.stringify(agent, null, 2), "utf-8");
    }
  }
  if (!existsSync(CUSTOM_AGENTS_DIR)) {
    mkdirSync(CUSTOM_AGENTS_DIR, { recursive: true });
  }
}

export function listAgents(): AgentDefinition[] {
  ensureBuiltinAgents();
  const builtin = BUILTIN_AGENTS.map((a) => {
    const path = agentFile(a.id, false);
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, "utf-8")) as AgentDefinition;
      } catch {
        return a;
      }
    }
    return a;
  });

  const customFiles = existsSync(CUSTOM_AGENTS_DIR)
    ? readdirSync(CUSTOM_AGENTS_DIR).filter((f) => f.endsWith(".json"))
    : [];

  const custom = customFiles.map((f) => {
    return JSON.parse(readFileSync(join(CUSTOM_AGENTS_DIR, f), "utf-8")) as AgentDefinition;
  });

  return [...builtin, ...custom];
}

export function getAgent(id: string): AgentDefinition | null {
  return listAgents().find((a) => a.id === id) ?? null;
}

export function createCustomAgent(input: {
  title: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}): AgentDefinition {
  ensureBuiltinAgents();
  const id = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || `agent-${Date.now()}`;

  const now = new Date().toISOString();
  const agent: AgentDefinition = {
    id,
    title: input.title,
    description: input.description,
    mode: "custom",
    systemPrompt:
      input.systemPrompt ??
      `You are the custom Candle AI agent "${input.title}". ${input.description}`,
    tools: input.tools ?? ["*"],
    createdAt: now,
    updatedAt: now,
    builtin: false,
  };

  const dir = join(CUSTOM_AGENTS_DIR, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "agent.json"), JSON.stringify(agent, null, 2), "utf-8");
  writeFileSync(agentFile(id, true), JSON.stringify(agent, null, 2), "utf-8");
  writeFileSync(
    join(dir, "README.md"),
    `# ${agent.title}\n\n${agent.description}\n\n## System prompt\n\n${agent.systemPrompt}\n`,
    "utf-8"
  );
  writeFileSync(
    join(dir, "prompt.txt"),
    agent.systemPrompt,
    "utf-8"
  );

  return agent;
}

export function slugifyAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
