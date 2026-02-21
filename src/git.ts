import { simpleGit, SimpleGit } from "simple-git";
import { execSync } from "child_process";
import chalk from "chalk";

const git: SimpleGit = simpleGit();

export const addStagedChanges = async (): Promise<void> => {
    await git.add(".");
};

export const getStagedDiff = (): string => {
    return execSync("git diff --staged").toString();
};

export const handleBranching = async (branchName: string): Promise<void> => {
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
};

export const commitChanges = async (message: string): Promise<void> => {
    await git.commit(message);
};

export const pushChanges = async (branchName: string): Promise<void> => {
    await git.push("origin", branchName, ["-u"]);
};
