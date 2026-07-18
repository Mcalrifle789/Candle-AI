import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import gradient from "gradient-string";
import { createCustomAgent } from "../core/agents.js";
import { CUSTOM_AGENTS_DIR } from "../core/paths.js";
import { join } from "node:path";

const candleGradient = gradient(["#FFD700", "#00E5FF"]);

export async function runCreateAgent(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  console.log();
  console.log(candleGradient("═══ Create Candle AI Agent ═══"));
  console.log();

  const title = (await rl.question(chalk.white("Agent title: "))).trim();
  if (!title) {
    console.log(chalk.red("Title is required."));
    rl.close();
    process.exit(1);
  }

  const description = (await rl.question(chalk.white("What does this agent do? "))).trim();
  if (!description) {
    console.log(chalk.red("Description is required."));
    rl.close();
    process.exit(1);
  }

  const systemPrompt = (
    await rl.question(chalk.gray("Optional custom system prompt (Enter to skip): "))
  ).trim();

  const agent = createCustomAgent({
    title,
    description,
    systemPrompt: systemPrompt || undefined,
  });

  rl.close();

  console.log();
  console.log(chalk.green(`✓ Agent "${agent.title}" created.`));
  console.log(chalk.gray(`  id:    ${agent.id}`));
  console.log(chalk.gray(`  path:  ${join(CUSTOM_AGENTS_DIR, agent.id)}`));
  console.log(chalk.gray(`  files: agent.json, prompt.txt, README.md`));
  console.log();
  console.log(chalk.cyan("Switch to it in-app with ") + chalk.white("/agent"));
  console.log();
}
