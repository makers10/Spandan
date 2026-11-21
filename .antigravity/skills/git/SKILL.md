# Git Skill

## Purpose
Version control hygiene, clean commit grouping, diff reviews, and history safety.

## When to Use
Load before staging, committing, branching, or reviewing git diffs.

## Rules
- Keep commits logically grouped by feature or bugfix. Never mix unrelated changes.
- Review `git diff` before declaring work complete.
- Never commit secrets, `.env` files, or temporary scratch logs.
- Keep generated native directories (`android/`, `ios/`) and build outputs (`dist/`, `.expo/`) in `.gitignore` unless explicitly maintained.
- Never rewrite git history (`git reset --hard`, `git push --force`) without explicit user instruction.
- Never delete working code, test suites, or documentation without justification.

## Preferred Patterns
- Clear, conventional commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Verifying clean working trees with `git status --short`.

## Anti-Patterns
- Committing large binary files or unneeded node modules.
- Committing temporary debugging `console.log` statements.

## Validation Checklist
- [ ] `git status` shows only intended modified files.
- [ ] No secrets or keys in `git diff`.
- [ ] Working tree builds and passes all tests cleanly.
