<div align="center">
  <h1>🚀 SmartCommit</h1>
  <p><em>The ultimate CLI tool to automate your Git workflow with AI-powered commit messages</em></p>
  
  [![npm version](https://img.shields.io/npm/v/smartcommit.svg)](https://www.npmjs.com/package/smartcommit)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

---

## 📖 About

**SmartCommit** takes the hassle out of version control. With a single command, it handles branch creation, automatically detects the type of changes you've made, generates a meaningful commit message using OpenAI, and pushes your code to origin. 

Stop overthinking your commit messages and let AI do the heavy lifting!

## ✨ Features

- 🤖 **AI-Generated Commits:** Uses OpenAI (GPT-4o-mini) to analyze your staged changes and write conventional commit messages.
- 🏷️ **Automatic Branching:** Enforces branch prefixes (`feature/`, `fix/`, `chore/`, etc.) effortlessly.
- 🎭 **Smart Gitmoji:** Automatically selects the perfect gitmoji based on your diff.
- ⚡ **One-command Workflow:** Add, commit, and push in a single step.
- 🔍 **Smart Fallback:** Defaults to keyword-based detection if the AI is unavailable.

---

## 📦 Installation

### Option 1: Global Installation (Recommended)
Install the package globally via npm:

```bash
npm install -g smartcommit
```

### Option 2: Local Development
Clone the repository and link it locally:

```bash
git clone https://github.com/your-username/smartcommit.git
cd smartcommit
npm install
npm run build
npm link
```

---

## 🔑 Configuration

SmartCommit requires an OpenAI API key to generate commit messages.

You must set the `OPENAI_API_KEY` environment variable. To do this, add it to your shell profile (e.g., `~/.zshrc` or `~/.bashrc`):

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
```

Alternatively, you can create a `.env` file in the directory where you run the tool:

```env
OPENAI_API_KEY=your_openai_api_key
```

---

## 🚀 Usage

Whenever you have changes (staged or unstaged), simply run:

```bash
smartcommit -n <branch-name>
```

### 🎯 Options

| Flag | Description | Mandatory |
|------|-------------|-----------|
| `-n`, `--name` | Name of the branch to create or use | **Yes** |
| `-t`, `--type` | Override commit type (`feature`, `fix`, `chore`, `refactor`, `hotfix`) | No |

### 🛠 Example Workflow

```bash
smartcommit -n login-form
```

**What happens under the hood?**
1. 📦 Runs `git add .` to stage all modifications.
2. 🤔 Analyzes the difference (`git diff`) using OpenAI.
3. 🌿 Creates (or switches to) a branch prefixed correctly: e.g., `feature/login-form`.
4. 📝 Generates an AI commit message like: `✨ feat: add login form validation`.
5. ⬆️ Automatically executes `git push origin feature/login-form -u`.

---

## ⚠️ Requirements

- **Node.js**: v18 or higher
- **Git**: Installed and accessible from your terminal
- **OpenAI API Key**: Required for AI generation features

---

## 🔮 Roadmap

- [ ] Support for pull request creation directly from the CLI
- [ ] Custom configuration file (`.smartcommitrc`) support
- [ ] Team configuration and prompt customization support
- [ ] Support for other LLM providers (Anthropic, Gemini, local models)

---

## 🎥 Demo

Watch SmartCommit in action:

https://github.com/user-attachments/assets/d7d19417-3c72-4c5e-9a05-5d0e0931a3fd

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
