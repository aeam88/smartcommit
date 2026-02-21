import OpenAI from "openai";
import chalk from "chalk";
import { CommitType } from "./cli.js";

export interface AITypeResponse {
    type: CommitType;
    gitmoji: string;
}

export const detectTypeKeywords = (diff: string): CommitType => {
    const lower = diff.toLowerCase();
    if (/bug|error|issue/.test(lower)) return "fix";
    if (/add|new|implement/.test(lower)) return "feature";
    if (/refactor|rename|reorganize/.test(lower)) return "refactor";
    if (/update deps|docs|ci|workflow/.test(lower)) return "chore";
    if (/critical|patch|emergency/.test(lower)) return "hotfix";
    return "chore";
};

export const getAIClient = (apiKey: string): OpenAI => {
    return new OpenAI({
        apiKey,
    });
};

export const detectCommitTypeAndGitmoji = async (
    openai: OpenAI,
    diff: string
): Promise<{ type: CommitType; gitmoji: string }> => {
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
            ["feature", "fix", "chore", "refactor", "hotfix"].includes(parsed.type)
        ) {
            return { type: parsed.type, gitmoji: parsed.gitmoji };
        } else {
            console.log(
                chalk.yellow("⚠️ AI returned invalid type, using keyword fallback.")
            );
            return { type: detectTypeKeywords(diff), gitmoji: "" };
        }
    } catch (error) {
        console.log(
            chalk.yellow("⚠️ AI detection failed, using keyword fallback.")
        );
        return { type: detectTypeKeywords(diff), gitmoji: "" };
    }
};

export const generateCommitMessage = async (
    openai: OpenAI,
    diff: string
): Promise<string> => {
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

    return completionMessage.choices[0].message.content?.trim() || "";
};
