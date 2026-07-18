import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { ensureAppDirs, SESSIONS_DIR } from "./paths.js";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agent?: string;
  model?: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  agent: string;
  model: string;
  mode: "build" | "plan";
  messages: ChatMessage[];
  tokenUsage: { input: number; output: number; total: number };
}

function sessionPath(id: string): string {
  return join(SESSIONS_DIR, `${id}.json`);
}

export function createSession(opts: {
  title?: string;
  agent?: string;
  model?: string;
  mode?: "build" | "plan";
}): Session {
  ensureAppDirs();
  const now = new Date().toISOString();
  const session: Session = {
    id: uuidv4(),
    title: opts.title ?? `Session ${new Date().toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    agent: opts.agent ?? "build",
    model: opts.model ?? "anthropic/claude-sonnet-4.6",
    mode: opts.mode ?? "build",
    messages: [],
    tokenUsage: { input: 0, output: 0, total: 0 },
  };
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), "utf-8");
  return session;
}

export function loadSession(id: string): Session | null {
  const path = sessionPath(id);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as Session;
}

export function saveSession(session: Session): void {
  ensureAppDirs();
  session.updatedAt = new Date().toISOString();
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), "utf-8");
}

export function deleteSession(id: string): boolean {
  const path = sessionPath(id);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

export function listSessions(): Session[] {
  ensureAppDirs();
  if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });
  return readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(SESSIONS_DIR, f), "utf-8")) as Session;
      } catch {
        return null;
      }
    })
    .filter((s): s is Session => Boolean(s))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function appendMessage(
  session: Session,
  role: ChatMessage["role"],
  content: string,
  meta?: { agent?: string; model?: string }
): Session {
  const msg: ChatMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date().toISOString(),
    agent: meta?.agent,
    model: meta?.model,
  };
  session.messages.push(msg);
  if (session.messages.length === 1 && role === "user") {
    session.title = content.slice(0, 60) + (content.length > 60 ? "…" : "");
  }
  saveSession(session);
  return session;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
