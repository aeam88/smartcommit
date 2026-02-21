#!/usr/bin/env node

import { Command } from "commander";
import { simpleGit, SimpleGit } from "simple-git";
import { execSync } from "child_process";
import OpenAI from "openai";
import dotenv from "dotenv";
import chalk from "chalk";
import enquirer from "enquirer";
const { prompt } = enquirer;

dotenv.config();

type CommitType = "feature" | "fix" | "chore" | "refactor" | "hotfix";

interface AITypeResponse {
  type: CommitType;
  gitmoji: string;
}

const program = new Command();
const git: SimpleGit = simpleGit();

if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red("❌ OPENAI_API_KEY is missing in .env"));
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

program
  .option(
    "-t, --type <type>",
    "Override commit type: feature | fix | chore | refactor | hotfix"
  )
  .requiredOption("-n, --name <name>", "Branch name")
  .parse(process.argv);

const options = program.opts<{
  type?: CommitType;
  name: string;
}>();

const detectTypeKeywords = (diff: string): CommitType => {
  const lower = diff.toLowerCase();
  if (/bug|error|issue/.test(lower)) return "fix";
  if (/add|new|implement/.test(lower)) return "feature";
  if (/refactor|rename|reorganize/.test(lower)) return "refactor";
  if (/update deps|docs|ci|workflow/.test(lower)) return "chore";
  if (/critical|patch|emergency/.test(lower)) return "hotfix";
  return "chore";
};

const run = async (): Promise<void> => {
  console.log(chalk.blue("📦 Adding changes..."));
  await git.add(".");

  const diff: string = execSync("git diff --staged").toString();

  if (!diff) {
    console.log(chalk.red("❌ No staged changes found."));
    process.exit(1);
  }

  let type: CommitType | undefined = options.type;
  let gitmoji = "";

  if (!type) {
    console.log(
      chalk.yellow("🤖 Detecting commit type and gitmoji automatically...")
    );

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
Do NOT include any extra text.
            `,
          },
          { role: "user", content: `Git diff:\n${diff}` },
        ],
      });

      const response = completion.choices[0].message.content?.trim() || "";

      const parsed: AITypeResponse = JSON.parse(response);

      if (
        ["feature", "fix", "chore", "refactor", "hotfix"].includes(
          parsed.type
        )
      ) {
        type = parsed.type;
        gitmoji = parsed.gitmoji;
      } else {
        console.log(
          chalk.yellow("⚠️ AI returned invalid type, using keyword fallback.")
        );
        type = detectTypeKeywords(diff);
      }
    } catch (error) {
      console.log(
        chalk.yellow("⚠️ AI detection failed, using keyword fallback.")
      );
      type = detectTypeKeywords(diff);
    }

    console.log(
      chalk.green(`✅ Detected type: ${type}, gitmoji: ${gitmoji || "none"}`)
    );
  }

  if (!type) {
    type = "chore";
  }

  const branchName = `${type}/${options.name}`;

  console.log(chalk.blue("🔍 Checking if branch already exists..."));


  const localBranches = await git.branchLocal();
  const existsLocal = localBranches.all.includes(branchName);

  const remoteBranches = await git.branch(["-r"]);
  const existsRemote = remoteBranches.all.some((b) =>
    b.replace("origin/", "") === branchName
  );


  if (existsLocal) {
    console.log(
      chalk.yellow(`⚠️ Branch already exists locally. Switching to it...`)
    );
    await git.checkout(branchName);
  } else if (existsRemote) {
    console.log(
      chalk.yellow(`⚠️ Branch exists in origin. Creating tracking branch...`)
    );
    await git.checkout(["-b", branchName, `origin/${branchName}`]);
  } else {
    console.log(chalk.blue(`🚀 Creating branch ${branchName}`));
    await git.checkoutLocalBranch(branchName);
  }

  console.log(chalk.blue("🤖 Generating commit message..."));

  const completionMessage = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate a concise conventional commit message, using gitmoji if available. Return only one line.",
      },
      { role: "user", content: `Git diff:\n${diff}` },
    ],
  });

  const commitMessageAI =
    completionMessage.choices[0].message.content?.trim() || "";

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
  await git.commit(finalCommitMessage);

  console.log(chalk.blue("⬆️ Pushing..."));
  await git.push("origin", branchName, ["-u"]);

  console.log(chalk.green("✅ Done!"));
};

run().catch((err) => {
  console.error(chalk.red("❌ Unexpected error:"), err);
  process.exit(1);
});