import dotenv from "dotenv";
import chalk from "chalk";

export interface Config {
    openaiKey: string;
}

export const loadConfig = (): Config => {
    dotenv.config();

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        console.error(chalk.red("❌ OPENAI_API_KEY is missing in .env"));
        process.exit(1);
    }

    return {
        openaiKey,
    };
};
