import chalk from "chalk";
import gradient from "gradient-string";
import { formatSkillsList, SKILLS } from "../skills/index.js";

const candleGradient = gradient(["#FFD700", "#00E5FF"]);

export async function runSkillsList(): Promise<void> {
  console.log();
  console.log(candleGradient(`Candle AI — ${SKILLS.length} Skills / Commands`));
  console.log(chalk.gray("Type / inside the app chatbox to open the scrollable picker.\n"));
  console.log(formatSkillsList());
  console.log(chalk.cyan("Tip: ") + chalk.white("/model") + chalk.gray(" · ") + chalk.white("/agent") + chalk.gray(" · ") + chalk.white("/skills"));
  console.log();
}
