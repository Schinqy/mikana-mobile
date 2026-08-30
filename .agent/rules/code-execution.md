---
trigger: always_on
---

# Antigravity - Code Execution Rules

These rules ensure safe, consistent, and clean code execution in the Mikana Mobile workspace.

## 1. Committing Changes
- All meaningful code changes must be committed consistently following Conventional Commits (`feat`, `fix`, `refactor`, `style`, `chore`).
- Keep commit messages concise, clear, and in the imperative mood.

## 2. File Management
- Important files (source code, configuration files, screens, types, stores) **must not be deleted** without explicit user confirmation.
- Deletions should be tracked and justified.

## 3. Terminal Usage & Scripts
- **NEVER use `&&` to chain commands in PowerShell.** PowerShell 5.x does not support `&&` and will throw syntax errors. Always use `;` instead (e.g. `git add . ; git commit -m "feat(radar): add filter"`).

## 4. Security
- Do **not** commit API keys, private tokens, or sensitive credentials to git.
- Store sensitive keys in `.env` or secure keystores.

## 5. Memory & Context
- **Always check `memory.md`** at the start of every session before proposing or making changes.
- **`lessons.md` is strictly append-only.** Never overwrite its content. Add new entries at the bottom.
- **Never create ad-hoc root configuration files** without explicit user approval. Rules live in `.agent/rules/`.
