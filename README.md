# 🚀 SmartCommit

CLI tool that automates your Git workflow:

- Creates a branch with the correct prefix
- Generates a commit message using AI
- Adds the correct gitmoji
- Commits your changes
- Pushes automatically to origin

---

## ✨ Features

- Conventional commits
- Automatic gitmoji selection
- Branch prefix enforcement
- AI-generated commit messages
- One-command workflow

---

## 📦 Installation

### Option 1: Local development

```bash
git clone <your-repo>
cd smartcommit
npm install
npm link
```

### Option 2: Global (after publishing)

```bash
npm install -g smartcommit
```

---

## 🔑 Configuration

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
```

---

## 🧠 Usage

```bash
smartcommit -t <type> -n <branch-name>
```

### Supported types

- feature
- fix
- chore
- refactor
- hotfix

---

## 🛠 Example

```bash
smartcommit -t feature -n login-form
```

This will:

1. Create branch `feature/login-form`
2. Run `git add .`
3. Generate commit message using AI
4. Commit
5. Push to origin

Example generated commit:

```
✨ feat: add login form validation
```

---

## ⚠️ Requirements

- Node.js 18+
- Git installed
- OpenAI API key

---

## 🔮 Roadmap

- [ ] Pull request creation
- [ ] Custom config file (.smartcommitrc)
- [ ] Team configuration support

---

## 📄 License

MIT
