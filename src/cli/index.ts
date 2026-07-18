#!/usr/bin/env node
import { Command } from "commander";
import React from "react";
import { render } from "ink";
import chalk from "chalk";
import gradient from "gradient-string";
import { ensureAppDirs } from "../core/paths.js";
import { isSetupComplete } from "../core/config.js";
import { ensureBuiltinAgents } from "../core/agents.js";
import { runSetup } from "../commands/setup.js";
import { runCreateAgent } from "../commands/create-agent.js";
import { runSkillsList } from "../commands/skills-list.js";
import { App } from "../ui/App.js";

const candleGradient = gradient(["#FFD700", "#00E5FF"]);

async function startApp(): Promise<void> {
  ensureAppDirs();
  ensureBuiltinAgents();

  if (!isSetupComplete()) {
    console.log(chalk.yellow("Candle AI is not set up yet.\n"));
    console.log(chalk.cyan("Run: ") + chalk.white("candle setup"));
    process.exit(1);
  }

  console.clear();
  const { waitUntilExit } = render(React.createElement(App));
  await waitUntilExit();
}

async function main(): Promise<void> {
  ensureAppDirs();
  const argv = process.argv.slice(2);

  // Multi-word command shortcuts
  if (argv[0] === "create" && argv[1] === "agent") {
    await runCreateAgent();
    return;
  }
  if (argv[0] === "skills" && argv[1] === "list") {
    await runSkillsList();
    return;
  }
  if (argv[0] === "setup") {
    await runSetup();
    return;
  }
  if (argv.length === 0 || argv[0] === "ai" || argv[0] === "start") {
    await startApp();
    return;
  }

  const program = new Command();
  program
    .name("candle")
    .description(`${candleGradient("Candle AI")} — Light up the way for your ideas`)
    .version("1.0.0");

  program
    .command("setup")
    .description("Configure username, password, API provider, key, and search provider")
    .action(runSetup);

  program
    .command("create")
    .description("Create Candle AI resources")
    .command("agent")
    .description("Create a custom agent (files under agents/custom)")
    .action(runCreateAgent);

  program
    .command("skills")
    .description("Skills utilities")
    .command("list")
    .description("Show all skills/commands and what they do")
    .action(runSkillsList);

  program.action(startApp);

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(chalk.red("Candle AI failed:"), err);
  process.exit(1);
});
