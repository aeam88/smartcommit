#!/usr/bin/env node

import { Command } from "commander";
import simpleGit from "simple-git";
import { execSync } from "child_process";
import OpenAI from "openai";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const program = new Command();
const git = simpleGit();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

program
  .option("-t, --type <type>", "Override commit type: feature | fix | chore | refactor | hotfix")
  .requiredOption("-n, --name <name>", "Branch name")
  .parse(process.argv);

const options = program.opts();

const detectTypeKeywords = (diff) => {
  const lower = diff.toLowerCase();
  if (/bug|error|issue/.test(lower)) return "fix";
  if (/add|new|implement/.test(lower)) return "feature";
  if (/refactor|rename|reorganize/.test(lower)) return "refactor";
  if (/update deps|docs|ci|workflow/.test(lower)) return "chore";
  if (/critical|patch|emergency/.test(lower)) return "hotfix";
  return "chore";
};

const run = async () => {
  console.log(chalk.blue("📦 Adding changes..."));
  await git.add(".");

  const diff = execSync("git diff --staged").toString();
  if (!diff) {
    console.log(chalk.red("❌ No staged changes found."));
    process.exit(1);
  }

  let type = options.type;
  let gitmoji = "";
  if (!type) {
    console.log(chalk.yellow("🤖 Detecting commit type and gitmoji automatically..."));
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a git assistant. 
Given a git diff, classify it into one of these types: feature, fix, refactor, chore, hotfix.
Also choose an appropriate gitmoji for the commit.
Return ONLY a JSON object with this format: {"type":"feature","gitmoji":"✨"}.
Do NOT include any extra text.`
          },
          { role: "user", content: `Git diff:\n${diff}` },
        ],
      });

      const response = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(response);

      type = parsed.type.toLowerCase();
      gitmoji = parsed.gitmoji;

      if (!["feature","fix","chore","refactor","hotfix"].includes(type)) {
        console.log(chalk.yellow("⚠️ AI returned invalid type, using keyword fallback."));
        type = detectTypeKeywords(diff);
        gitmoji = "";
      }

    } catch (error) {
      console.log(chalk.yellow("⚠️ AI detection failed, using keyword fallback."));
      type = detectTypeKeywords(diff);
      gitmoji = "";
    }

    console.log(chalk.green(`✅ Detected type: ${type}, gitmoji: ${gitmoji || "none"}`));
  }

  const branchName = `${type}/${options.name}`;
  console.log(chalk.blue(`🚀 Creating branch ${branchName}`));
  await git.checkoutLocalBranch(branchName);

  console.log(chalk.blue("🤖 Generating commit message..."));
  const completionMessage = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Generate a concise conventional commit message, using gitmoji if available. Return only one line.",
      },
      { role: "user", content: `Git diff:\n${diff}` },
    ],
  });

  const commitMessageAI = completionMessage.choices[0].message.content.trim();
  const commitMessage = `${gitmoji} ${commitMessageAI}`.trim();

  console.log(chalk.green(`📝 Commit message: ${commitMessage}`));

  await git.commit(commitMessage);

  console.log(chalk.blue("⬆️ Pushing..."));
  await git.push("origin", branchName, ["-u"]);

  console.log(chalk.green("✅ Done!"));
};

run();
