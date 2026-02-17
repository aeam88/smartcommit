#!/usr/bin/env node

import { Command } from "commander";
import simpleGit from "simple-git";
import { execSync } from "child_process";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();
const git = simpleGit();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

program
  .requiredOption("-t, --type <type>", "Type: feature | fix | chore | refactor | hotfix")
  .requiredOption("-n, --name <name>", "Branch name")
  .parse(process.argv);

const options = program.opts();

const run = async () => {
  const branchName = `${options.type}/${options.name}`;

  console.log(`🚀 Creating branch ${branchName}`);
  await git.checkoutLocalBranch(branchName);

  console.log("📦 Adding changes...");
  await git.add(".");

  const diff = execSync("git diff --staged").toString();

  if (!diff) {
    console.log("❌ No staged changes found.");
    process.exit(1);
  }

  console.log("🤖 Generating commit message...");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You generate conventional commit messages using gitmoji. Return only one line.",
      },
      {
        role: "user",
        content: `Git diff:\n${diff}`,
      },
    ],
  });

  const commitMessage = completion.choices[0].message.content.trim();

  console.log(`📝 Commit message: ${commitMessage}`);

  await git.commit(commitMessage);

  console.log("⬆️ Pushing...");
  await git.push("origin", branchName, ["-u"]);

  console.log("✅ Done!");
};

run();
