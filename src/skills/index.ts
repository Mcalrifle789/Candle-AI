export interface Skill {
  name: string;
  command: string;
  description: string;
  category: string;
}

/** 48 slash skills/commands available inside Candle AI */
export const SKILLS: Skill[] = [
  { name: "Help", command: "/help", description: "Show help and keyboard shortcuts", category: "core" },
  { name: "Model", command: "/model", description: "Switch or add AI models", category: "core" },
  { name: "Agent", command: "/agent", description: "Switch agents (build, plan, custom)", category: "core" },
  { name: "Mode", command: "/mode", description: "Toggle build / plan mode", category: "core" },
  { name: "Clear", command: "/clear", description: "Clear the current chat view", category: "core" },
  { name: "New", command: "/new", description: "Start a new session", category: "core" },
  { name: "Sessions", command: "/sessions", description: "List saved local sessions", category: "core" },
  { name: "Open Session", command: "/open", description: "Open a session by id", category: "core" },
  { name: "Save", command: "/save", description: "Force-save current session", category: "core" },
  { name: "Exit", command: "/exit", description: "Exit Candle AI", category: "core" },
  { name: "Search", command: "/search", description: "Search the web via configured provider", category: "web" },
  { name: "Browse", command: "/browse", description: "Fetch and summarize a URL", category: "web" },
  { name: "News", command: "/news", description: "Pull latest news on a topic", category: "web" },
  { name: "Research", command: "/research", description: "Deep multi-source research pass", category: "web" },
  { name: "Code", command: "/code", description: "Write or refactor code", category: "dev" },
  { name: "Explain", command: "/explain", description: "Explain code or a concept", category: "dev" },
  { name: "Review", command: "/review", description: "Review code for bugs and quality", category: "dev" },
  { name: "Test", command: "/test", description: "Generate or run tests", category: "dev" },
  { name: "Debug", command: "/debug", description: "Debug an error or stack trace", category: "dev" },
  { name: "Refactor", command: "/refactor", description: "Refactor selected logic safely", category: "dev" },
  { name: "Commit", command: "/commit", description: "Draft a git commit message", category: "dev" },
  { name: "PR", command: "/pr", description: "Draft a pull request description", category: "dev" },
  { name: "Shell", command: "/shell", description: "Run a shell command with approval", category: "system" },
  { name: "Files", command: "/files", description: "List or inspect local files", category: "system" },
  { name: "Read", command: "/read", description: "Read a local file", category: "system" },
  { name: "Write", command: "/write", description: "Write or create a local file", category: "system" },
  { name: "Desktop", command: "/desktop", description: "Access and work with Desktop files", category: "system" },
  { name: "Open Path", command: "/openpath", description: "Open a path in the OS file manager", category: "system" },
  { name: "Image", command: "/image", description: "Generate an image from a prompt", category: "media" },
  { name: "Vision", command: "/vision", description: "Analyze an image file", category: "media" },
  { name: "Voice", command: "/voice", description: "Text-to-speech via ElevenLabs", category: "media" },
  { name: "Transcribe", command: "/transcribe", description: "Speech-to-text via ElevenLabs", category: "media" },
  { name: "ElevenLabs", command: "/elevenlabs", description: "Configure ElevenLabs MCP connection", category: "media" },
  { name: "Agents List", command: "/agents", description: "List all available agents", category: "agents" },
  { name: "Create Agent", command: "/create-agent", description: "Create a custom agent inline", category: "agents" },
  { name: "Run Agent", command: "/run-agent", description: "Run a named agent on a task", category: "agents" },
  { name: "Skills", command: "/skills", description: "Browse all 48 skills/commands", category: "core" },
  { name: "Plan", command: "/plan", description: "Produce a structured implementation plan", category: "agents" },
  { name: "Build", command: "/build", description: "Switch to build mode and execute", category: "agents" },
  { name: "Summarize", command: "/summarize", description: "Summarize text, files, or chat", category: "writing" },
  { name: "Rewrite", command: "/rewrite", description: "Rewrite text in a target style", category: "writing" },
  { name: "Translate", command: "/translate", description: "Translate text between languages", category: "writing" },
  { name: "Docs", command: "/docs", description: "Generate documentation", category: "writing" },
  { name: "Email", command: "/email", description: "Draft a professional email", category: "writing" },
  { name: "Todo", command: "/todo", description: "Break work into a checklist", category: "productivity" },
  { name: "Remember", command: "/remember", description: "Store a note in session memory", category: "productivity" },
  { name: "Config", command: "/config", description: "Show current Candle AI configuration", category: "core" },
  { name: "Provider", command: "/provider", description: "Show or switch API provider settings", category: "core" },
];

export function findSkills(query: string): Skill[] {
  const q = query.replace(/^\//, "").toLowerCase().trim();
  if (!q) return SKILLS;
  return SKILLS.filter(
    (s) =>
      s.command.slice(1).startsWith(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
  );
}

export function getSkill(command: string): Skill | undefined {
  const cmd = command.startsWith("/") ? command : `/${command}`;
  return SKILLS.find((s) => s.command === cmd || s.command === cmd.split(/\s+/)[0]);
}

export function formatSkillsList(): string {
  const byCat = new Map<string, Skill[]>();
  for (const s of SKILLS) {
    const list = byCat.get(s.category) ?? [];
    list.push(s);
    byCat.set(s.category, list);
  }
  const lines: string[] = [`Candle AI Skills (${SKILLS.length})`, ""];
  for (const [cat, skills] of byCat) {
    lines.push(`[${cat}]`);
    for (const s of skills) {
      lines.push(`  ${s.command.padEnd(16)} ${s.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
