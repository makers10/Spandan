# Documentation Skill

## Purpose
Guidelines for maintaining accurate, token-efficient, and non-redundant project documentation.

## When to Use
Load when updating `docs/` or creating technical specifications.

## Rules
- Keep documentation short, concrete, and directly relevant to this project's architecture.
- Do not duplicate content: `AGENTS.md` is the high-level router; specific deep-dives belong in `docs/` or `.antigravity/skills/`.
- When an architecture rule changes, update the single source of truth and remove obsolete rules.
- Use GitHub Flavored Markdown with clickable `file://` links where appropriate.
- Every architectural decision must be logged in `docs/DECISIONS.md`.

## Preferred Patterns
- Structured markdown tables for comparisons and feature matrixes.
- Concise ASCII architecture diagrams.

## Anti-Patterns
- Long-winded essays repeating general programming tutorials.
- Storing outdated API contracts that drift from actual code.

## Validation Checklist
- [ ] No duplicated information across files.
- [ ] Every documented command works as described.
- [ ] File paths and links are accurate.
