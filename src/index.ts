#!/usr/bin/env node

import chalk from "chalk";
import enquirer from "enquirer";
import { loadConfig } from "./config.js";
import { parseArgs } from "./cli.js";
import {
  addStagedChanges,
  getStagedDiff,
  handleBranching,
  commitChanges,
  pushChanges,
} from "./git.js";
import {
  getAIClient,
  detectCommitTypeAndGitmoji,
  generateCommitMessage,
} from "./ai.js";

const { prompt } = enquirer;

const run = async (): Promise<void> => {
  const config = loadConfig();
  const options = parseArgs();
  const openai = getAIClient(config.openaiKey);

  console.log(chalk.blue("📦 Adding changes..."));
  await addStagedChanges();

  const diff = getStagedDiff();
  if (!diff) {
    console.log(chalk.red("❌ No staged changes found."));
    process.exit(1);
  }

  let type = options.type;
  let gitmoji = "";

  if (!type) {
    console.log(
      chalk.yellow("🤖 Detecting commit type and gitmoji automatically...")
    );

    const detected = await detectCommitTypeAndGitmoji(openai, diff);
    type = detected.type;
    gitmoji = detected.gitmoji;

    console.log(
      chalk.green(`✅ Detected type: ${type}, gitmoji: ${gitmoji || "none"}`)
    );
  }

  if (!type) {
    type = "chore";
  }

  const branchName = `${type}/${options.name}`;
  console.log(chalk.blue("🔍 Checking if branch already exists..."));
  await handleBranching(branchName);

  console.log(chalk.blue("🤖 Generating commit message..."));

  const commitMessageAI = await generateCommitMessage(openai, diff);
  const commitMessage = `${gitmoji} ${commitMessageAI}`.trim();

  const { action } = await prompt<{ action: string }>({
    type: "select",
    name: "action",
    message: `📝 AI Suggested Commit: ${chalk.green(commitMessage)}\nWhat would you like to do?`,
    choices: [
      { name: "commit", message: "✅ Accept and commit" },
      { name: "edit", message: "✏️  Edit message" },
      { name: "cancel", message: "❌ Cancel" },
    ],
  });

  let finalCommitMessage = commitMessage;

  if (action === "cancel") {
    console.log(chalk.yellow("Declined commit. Exiting."));
    process.exit(0);
  }

  if (action === "edit") {
    const { editedMessage } = await prompt<{ editedMessage: string }>({
      type: "input",
      name: "editedMessage",
      message: "Edit your commit message:",
      initial: commitMessage,
    });
    finalCommitMessage = editedMessage;
  }

  console.log(chalk.blue(`🚀 Committing: ${finalCommitMessage}`));
  await commitChanges(finalCommitMessage);

  console.log(chalk.blue("⬆️ Pushing..."));
  await pushChanges(branchName);

  console.log(chalk.green("✅ Done!"));
};

run().catch((err) => {
  console.error(chalk.red("❌ Unexpected error:"), err);
  process.exit(1);
});