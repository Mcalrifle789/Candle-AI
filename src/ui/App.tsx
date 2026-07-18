import React, { useCallback, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Logo } from "./components/Logo.js";
import { ChatBox } from "./components/ChatBox.js";
import { ModeButtons } from "./components/ModeButtons.js";
import { SkillsMenu } from "./components/SkillsMenu.js";
import { ModelPicker } from "./components/ModelPicker.js";
import { AgentPicker } from "./components/AgentPicker.js";
import { MessageList } from "./components/MessageList.js";
import { findSkills, getSkill, SKILLS } from "../skills/index.js";
import {
  appendMessage,
  createSession,
  estimateTokens,
  saveSession,
  type Session,
} from "../core/sessions.js";
import { listAgents, getAgent } from "../core/agents.js";
import { listAllModels } from "../core/models.js";
import {
  loadUserConfig,
  saveUserConfig,
  loadSecrets,
  saveSecrets,
  saveCustomModels,
  loadCustomModels,
} from "../core/config.js";
import {
  chatCompletion,
  desktopListing,
  elevenLabsSpeak,
  generateImage,
  searchWeb,
} from "../providers/chat.js";
import { SESSIONS_DIR, getDesktopPath } from "../core/paths.js";

type Overlay = "none" | "skills" | "model" | "agent" | "mode";

export function App(): React.ReactElement {
  const { exit } = useApp();
  const cfg = loadUserConfig();
  const [session, setSession] = useState<Session>(() =>
    createSession({
      agent: cfg?.activeAgent ?? "build",
      model: cfg?.defaultModel ?? "anthropic/claude-sonnet-4.6",
      mode: cfg?.mode ?? "build",
    })
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Candle AI agent initialized. You can start chatting below.");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [skillQuery, setSkillQuery] = useState("");
  const [skillIndex, setSkillIndex] = useState(0);
  const [modelFilter, setModelFilter] = useState("");
  const [modelIndex, setModelIndex] = useState(0);
  const [agentIndex, setAgentIndex] = useState(0);
  const [modeFocus, setModeFocus] = useState<"build" | "plan" | null>(null);
  const [tokens, setTokens] = useState({ used: 0, max: 1000000 });

  const skills = useMemo(() => findSkills(skillQuery), [skillQuery]);
  const models = useMemo(() => {
    const all = listAllModels();
    if (!modelFilter) return all;
    const q = modelFilter.toLowerCase();
    return all.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  }, [modelFilter]);
  const agents = useMemo(() => listAgents(), [session.agent, status]);

  const setMode = useCallback((mode: "build" | "plan") => {
    setSession((s) => {
      const next = { ...s, mode, agent: mode };
      saveSession(next);
      return next;
    });
    const userCfg = loadUserConfig();
    if (userCfg) {
      userCfg.mode = mode;
      userCfg.activeAgent = mode;
      saveUserConfig(userCfg);
    }
    setStatus(`Switched to ${mode.toUpperCase()} mode.`);
    setOverlay("none");
    setModeFocus(null);
  }, []);

  useInput((ch, key) => {
    if (overlay === "skills") {
      if (key.escape) {
        setOverlay("none");
        setSkillQuery("");
        return;
      }
      if (key.upArrow) {
        setSkillIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSkillIndex((i) => Math.min(skills.length - 1, i + 1));
        return;
      }
      if (key.return || key.tab) {
        const skill = skills[skillIndex];
        if (skill) {
          setInput(skill.command + " ");
          setOverlay("none");
          setSkillQuery("");
        }
        return;
      }
      if (key.backspace || key.delete) {
        setSkillQuery((q) => q.slice(0, -1));
        setSkillIndex(0);
        return;
      }
      if (ch && ch.length === 1 && !key.ctrl && ch !== "/") {
        setSkillQuery((q) => q + ch);
        setSkillIndex(0);
      }
      return;
    }

    if (overlay === "model") {
      if (key.escape) {
        setOverlay("none");
        setModelFilter("");
        return;
      }
      if (key.upArrow) {
        setModelIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setModelIndex((i) => Math.min(models.length - 1, i + 1));
        return;
      }
      if (ch === "a" && !modelFilter) {
        void addCustomModelFlow();
        return;
      }
      if (key.return) {
        const model = models[modelIndex];
        if (model) {
          setSession((s) => {
            const next = { ...s, model: model.id };
            saveSession(next);
            return next;
          });
          const userCfg = loadUserConfig();
          if (userCfg) {
            userCfg.defaultModel = model.id;
            saveUserConfig(userCfg);
          }
          setStatus(`Model set to ${model.name} (${model.id})`);
          setOverlay("none");
          setModelFilter("");
        }
        return;
      }
      if (key.backspace || key.delete) {
        setModelFilter((q) => q.slice(0, -1));
        setModelIndex(0);
        return;
      }
      if (ch && ch.length === 1 && !key.ctrl) {
        setModelFilter((q) => q + ch);
        setModelIndex(0);
      }
      return;
    }

    if (overlay === "agent") {
      if (key.escape) {
        setOverlay("none");
        return;
      }
      if (key.upArrow) {
        setAgentIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setAgentIndex((i) => Math.min(agents.length - 1, i + 1));
        return;
      }
      if (key.return) {
        const agent = agents[agentIndex];
        if (agent) {
          setSession((s) => {
            const next = {
              ...s,
              agent: agent.id,
              mode: agent.mode === "plan" ? "plan" : agent.mode === "build" ? "build" : s.mode,
            };
            saveSession(next);
            return next;
          });
          const userCfg = loadUserConfig();
          if (userCfg) {
            userCfg.activeAgent = agent.id;
            if (agent.mode === "build" || agent.mode === "plan") userCfg.mode = agent.mode;
            saveUserConfig(userCfg);
          }
          setStatus(`Agent switched to ${agent.title}`);
          setOverlay("none");
        }
        return;
      }
      return;
    }

    if (overlay === "mode") {
      if (key.escape) {
        setOverlay("none");
        setModeFocus(null);
        return;
      }
      if (key.tab || key.leftArrow || key.rightArrow) {
        setModeFocus((f) => (f === "build" ? "plan" : "build"));
        return;
      }
      if (key.return && modeFocus) {
        setMode(modeFocus);
        return;
      }
      return;
    }

    if (key.tab && overlay === "none" && !loading) {
      setOverlay("mode");
      setModeFocus(session.mode);
      return;
    }

    if (key.escape && overlay === "none") {
      exit();
    }
  });

  async function addCustomModelFlow(): Promise<void> {
    // lightweight: mark status; full custom add via typed command
    setStatus('Add custom model: type "/model add name|provider|id|apikey" in chat');
    setOverlay("none");
  }

  async function handleSlash(raw: string): Promise<string | null> {
    const text = raw.trim();
    const [cmd, ...rest] = text.split(/\s+/);
    const arg = rest.join(" ").trim();
    const skill = getSkill(cmd || "");

    switch (cmd) {
      case "/help":
        return "Commands: /model /agent /mode /skills /search /desktop /image /voice /elevenlabs /new /sessions /exit — type / for full list.";
      case "/exit":
      case "/quit":
        exit();
        return null;
      case "/clear":
        setSession((s) => {
          const next = { ...s, messages: [] };
          saveSession(next);
          return next;
        });
        return "Chat view cleared (session file retained).";
      case "/new":
        setSession(
          createSession({
            agent: session.agent,
            model: session.model,
            mode: session.mode,
          })
        );
        setTokens({ used: 0, max: tokens.max });
        return "New session started.";
      case "/sessions":
        return `Sessions folder: ${SESSIONS_DIR}\nDeleted files here are permanently gone.`;
      case "/save":
        saveSession(session);
        return `Saved session ${session.id}`;
      case "/model": {
        if (arg.startsWith("add ")) {
          const parts = arg.slice(4).split("|").map((p) => p.trim());
          const [name, provider, id, apiKey] = parts;
          if (!name || !provider || !id) {
            return "Usage: /model add name|provider|id|apikey";
          }
          const modelsList = loadCustomModels();
          modelsList.push({ id, name, provider, contextWindow: 128000 });
          saveCustomModels(modelsList);
          if (apiKey) {
            const secrets = loadSecrets();
            secrets.customModelKeys[id] = apiKey;
            secrets.providerKeys[provider] = secrets.providerKeys[provider] || apiKey;
            saveSecrets(secrets);
          }
          return `Custom model added: ${name} (${id})`;
        }
        setOverlay("model");
        setModelIndex(0);
        setModelFilter(arg);
        return null;
      }
      case "/agent":
      case "/agents":
        setOverlay("agent");
        setAgentIndex(Math.max(0, agents.findIndex((a) => a.id === session.agent)));
        return null;
      case "/mode":
        if (arg === "build" || arg === "plan") {
          setMode(arg);
          return null;
        }
        setOverlay("mode");
        setModeFocus(session.mode);
        return null;
      case "/build":
        setMode("build");
        return arg ? null : "Build mode active.";
      case "/plan":
        setMode("plan");
        return arg ? null : "Plan mode active.";
      case "/skills":
        return SKILLS.map((s) => `${s.command.padEnd(16)} ${s.description}`).join("\n");
      case "/config":
      case "/provider": {
        const c = loadUserConfig();
        return [
          `User: ${c?.username ?? "?"}`,
          `Provider: ${c?.apiProvider ?? "?"}`,
          `Search: ${c?.searchProvider ?? "?"}`,
          `Model: ${session.model}`,
          `Agent: ${session.agent}`,
          `Mode: ${session.mode}`,
          `Desktop: ${c?.desktopAccess ? getDesktopPath() : "off"}`,
          `ElevenLabs: ${c?.elevenLabsEnabled ? "on" : "off"}`,
        ].join("\n");
      }
      case "/desktop": {
        const listing = await desktopListing();
        return listing;
      }
      case "/search": {
        if (!arg) return "Usage: /search <query>";
        return await searchWeb(arg);
      }
      case "/image": {
        if (!arg) return "Usage: /image <prompt>";
        return await generateImage(arg);
      }
      case "/voice": {
        if (!arg) return "Usage: /voice <text>";
        return await elevenLabsSpeak(arg);
      }
      case "/elevenlabs": {
        if (!arg) {
          const s = loadSecrets();
          return s.elevenLabsApiKey
            ? "ElevenLabs API key is configured. MCP bridge ready."
            : "No key set. Usage: /elevenlabs <api-key>";
        }
        const secrets = loadSecrets();
        secrets.elevenLabsApiKey = arg;
        saveSecrets(secrets);
        const userCfg = loadUserConfig();
        if (userCfg) {
          userCfg.elevenLabsEnabled = true;
          saveUserConfig(userCfg);
        }
        return "ElevenLabs MCP enabled and API key saved.";
      }
      case "/create-agent":
        return "Use terminal command: candle create agent";
      default:
        if (skill) {
          return `Skill ${skill.command}: ${skill.description}${arg ? `\nInput: ${arg}` : ""}\n(Routed to agent)`;
        }
        return null;
    }
  }

  async function onSubmit(value: string): Promise<void> {
    const text = value.trim();
    if (!text || loading) return;
    setInput("");

    if (text === "/") {
      setOverlay("skills");
      setSkillQuery("");
      setSkillIndex(0);
      return;
    }

    if (text.startsWith("/") && !text.includes(" ") && findSkills(text.slice(1)).length > 1 && text !== "/exit") {
      // open menu filtered
      if (["/model", "/agent", "/agents", "/mode", "/skills"].includes(text.split(/\s+/)[0] || "")) {
        // fall through to handler
      }
    }

    setLoading(true);
    let s = appendMessage(session, "user", text, { agent: session.agent, model: session.model });
    setSession({ ...s });

    try {
      if (text.startsWith("/")) {
        const direct = await handleSlash(text);
        if (direct === null && overlay !== "none") {
          setLoading(false);
          return;
        }
        if (direct !== null && direct !== undefined) {
          // If slash skill should still go to LLM when it returned "Routed to agent" without enough, continue
          const shouldLlm =
            direct.endsWith("(Routed to agent)") ||
            text.startsWith("/code") ||
            text.startsWith("/explain") ||
            text.startsWith("/review") ||
            text.startsWith("/plan ") ||
            text.startsWith("/build ") ||
            text.startsWith("/research") ||
            text.startsWith("/rewrite") ||
            text.startsWith("/summarize") ||
            text.startsWith("/debug") ||
            text.startsWith("/refactor") ||
            text.startsWith("/docs") ||
            text.startsWith("/email") ||
            text.startsWith("/todo") ||
            text.startsWith("/write") ||
            text.startsWith("/read");

          if (!shouldLlm) {
            s = appendMessage(s, "assistant", direct, { agent: session.agent, model: session.model });
            setSession({ ...s });
            setStatus("Ready.");
            setLoading(false);
            return;
          }
        }
      }

      const reply = await chatCompletion({
        messages: s.messages,
        model: s.model,
        agentId: s.agent,
        mode: s.mode,
        userText: text,
      });

      s = appendMessage(s, "assistant", reply.content, { agent: s.agent, model: s.model });
      s.tokenUsage.input += reply.inputTokens;
      s.tokenUsage.output += reply.outputTokens;
      s.tokenUsage.total += reply.inputTokens + reply.outputTokens;
      saveSession(s);
      setSession({ ...s });
      setTokens((t) => ({
        used: s.tokenUsage.total,
        max: t.max,
      }));
      setStatus("Ready.");
    } catch (e) {
      const msg = (e as Error).message;
      s = appendMessage(s, "assistant", `Error: ${msg}`, { agent: session.agent });
      setSession({ ...s });
      setStatus("Error.");
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(v: string): void {
    setInput(v);
    if (overlay === "none" && v === "/") {
      setOverlay("skills");
      setSkillQuery("");
      setSkillIndex(0);
      setInput("");
    }
  }

  const agentTitle = getAgent(session.agent)?.title ?? session.agent;
  const tokenLabel = `${formatCount(tokens.used)}/${formatCount(tokens.max)} tokens`;

  return (
    <Box flexDirection="column" width="100%" paddingX={1}>
      {session.messages.length === 0 ? <Logo /> : null}

      <Box marginBottom={1}>
        <Text color="green">● </Text>
        <Text>{status}</Text>
      </Box>

      <Box marginBottom={1}>
        <ModeButtons mode={session.mode} focused={overlay === "mode" ? modeFocus : null} />
      </Box>

      {session.messages.length > 0 ? <MessageList messages={session.messages} /> : null}

      {overlay === "skills" ? (
        <SkillsMenu skills={skills} selected={skillIndex} query={skillQuery} />
      ) : null}
      {overlay === "model" ? (
        <ModelPicker models={models} selected={modelIndex} filter={modelFilter} />
      ) : null}
      {overlay === "agent" ? (
        <AgentPicker agents={agents} selected={agentIndex} activeId={session.agent} />
      ) : null}

      <ChatBox
        value={input}
        onChange={onInputChange}
        onSubmit={onSubmit}
        loading={loading}
        placeholder="Ask anything..."
      />

      <Box justifyContent="space-between" width="100%" marginTop={0}>
        <Text>
          <Text color="cyan">Model: </Text>
          <Text color="cyan" bold>
            {prettyModel(session.model)}
          </Text>
          <Text dimColor>
            {"  "}· {agentTitle} · {session.mode}
          </Text>
        </Text>
        <Text color="cyan">{tokenLabel}</Text>
      </Box>

      <Box>
        <Text dimColor>
          / skills · /model · /agent · Tab modes · sessions: local only · Esc quit
        </Text>
      </Box>
    </Box>
  );
}

function prettyModel(id: string): string {
  const map: Record<string, string> = {
    "anthropic/claude-sonnet-4.6": "Claude Sonnet 4.6",
    "anthropic/claude-opus-4.6": "Claude Opus 4.6",
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
  };
  return map[id] ?? id;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

// silence unused import in some bundlers
void estimateTokens;
