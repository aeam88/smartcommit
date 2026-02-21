import { Command } from "commander";

export type CommitType = "feature" | "fix" | "chore" | "refactor" | "hotfix";

export interface CLIOptions {
    type?: CommitType;
    name: string;
}

export const parseArgs = (): CLIOptions => {
    const program = new Command();

    program
        .option(
            "-t, --type <type>",
            "Override commit type: feature | fix | chore | refactor | hotfix"
        )
        .requiredOption("-n, --name <name>", "Branch name")
        .parse(process.argv);

    return program.opts<CLIOptions>();
};
