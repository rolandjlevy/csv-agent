# Claude Code Token Saving Guide

### 🗂️ 1. Block Heavy Files (One-Time Setup)

Create a `.claudeignore` file in your project root and paste this exact text:

```text
.next/
node_modules/
build/
dist/
public/
*.log
.env*
```

### 🧹 2. Terminal Session Habits

- **Compress history**: Run `/compact` every 20-30 turns to condense the chat history summary.
- **Clear the chat**: Run `/clear` immediately when switching to a brand new task.
- **Edit, don't reply**: Edit your original prompt in the console instead of sending follow-up corrections.

### 🎯 3. Targeted Context Layout

- **Keep CLAUDE.md lean**: Strip out framework defaults from `CLAUDE.md`; list only core architecture and build commands.
- **Use exact references**: Target specific files using the `@filename` system instead of letting Claude search.
- **Use Plan Mode**: Always review task breakdowns before allowing Claude to write code or run commands.

### ⚙️ 4. Tool & Model Adjustments

- **Stick to Sonnet**: Keep Claude 3.5 Sonnet as your active model; avoid mid-session switches to keep prompt caching active.
- **Limit MCP Servers**: Keep Model Context Protocol (MCP) servers disabled unless actively needed for the task.
