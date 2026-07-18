import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import gradient from "gradient-string";
import {
  createUserConfig,
  loadSecrets,
  saveSecrets,
  type ApiProvider,
  type SearchProvider,
} from "../core/config.js";
import { ensureAppDirs } from "../core/paths.js";

const candleGradient = gradient(["#FFD700", "#FFEA00", "#00E5FF", "#00B4D8"]);

const API_PROVIDERS: ApiProvider[] = [
  "openrouter",
  "opencode-zen",
  "novita",
  "openai",
  "anthropic",
  "grok",
  "google-gemini",
  "kimi",
  "kilo",
  "custom",
];

const SEARCH_PROVIDERS: SearchProvider[] = [
  "duckduckgo",
  "google-gemini",
  "parallel",
  "parallel-free",
  "tavily",
  "brave",
  "bing",
  "serper",
];

async function ask(rl: readline.Interface, q: string): Promise<string> {
  const a = await rl.question(q);
  return a.trim();
}

async function pickFromList<T extends string>(
  rl: readline.Interface,
  title: string,
  items: T[]
): Promise<T> {
  console.log(chalk.cyan(`\n${title}`));
  items.forEach((item, i) => console.log(chalk.gray(`  ${i + 1}.`) + ` ${item}`));
  while (true) {
    const raw = await ask(rl, chalk.yellow("Select number: "));
    const n = Number(raw);
    if (n >= 1 && n <= items.length) return items[n - 1]!;
    console.log(chalk.red("Invalid selection."));
  }
}

export async function runSetup(): Promise<void> {
  ensureAppDirs();
  const rl = readline.createInterface({ input, output });

  console.log();
  console.log(candleGradient("═══ Candle AI Setup ═══"));
  console.log(chalk.gray("Light up the way for your ideas\n"));

  const username = await ask(rl, chalk.white("Custom username: "));
  if (!username) {
    console.log(chalk.red("Username is required."));
    rl.close();
    process.exit(1);
  }

  let password = "";
  let confirm = "";
  while (true) {
    password = await ask(rl, chalk.white("Password: "));
    confirm = await ask(rl, chalk.white("Confirm password: "));
    if (!password) {
      console.log(chalk.red("Password is required."));
      continue;
    }
    if (password !== confirm) {
      console.log(chalk.red("Passwords do not match."));
      continue;
    }
    break;
  }

  const apiProvider = await pickFromList(rl, "API provider:", API_PROVIDERS);
  const apiKey = await ask(rl, chalk.white(`API key for ${apiProvider}: `));

  const searchProvider = await pickFromList(rl, "Search provider:", SEARCH_PROVIDERS);

  const enableEleven = (await ask(rl, chalk.white("Enable ElevenLabs MCP? (y/N): "))).toLowerCase();
  let elevenKey = "";
  if (enableEleven === "y" || enableEleven === "yes") {
    elevenKey = await ask(rl, chalk.white("ElevenLabs API key: "));
  }

  const desktop = (await ask(rl, chalk.white("Allow Desktop access? (Y/n): "))).toLowerCase();

  createUserConfig({
    username,
    password,
    apiProvider,
    searchProvider,
  });

  const secrets = loadSecrets();
  secrets.apiKey = apiKey;
  secrets.providerKeys[apiProvider] = apiKey;
  if (elevenKey) secrets.elevenLabsApiKey = elevenKey;
  saveSecrets(secrets);

  // patch flags
  const { loadUserConfig, saveUserConfig } = await import("../core/config.js");
  const cfg = loadUserConfig();
  if (cfg) {
    cfg.elevenLabsEnabled = Boolean(elevenKey);
    cfg.desktopAccess = !(desktop === "n" || desktop === "no");
    saveUserConfig(cfg);
  }

  rl.close();

  console.log();
  console.log(chalk.green("✓ Candle AI setup complete."));
  console.log(chalk.gray(`  User:     ${username}`));
  console.log(chalk.gray(`  Provider: ${apiProvider}`));
  console.log(chalk.gray(`  Search:   ${searchProvider}`));
  console.log(chalk.gray(`  ElevenLabs: ${elevenKey ? "enabled" : "disabled"}`));
  console.log(chalk.gray(`  Desktop:  ${!(desktop === "n" || desktop === "no")}`));
  console.log();
  console.log(chalk.cyan("Run ") + chalk.white("candle") + chalk.cyan(" to start."));
  console.log();
}
