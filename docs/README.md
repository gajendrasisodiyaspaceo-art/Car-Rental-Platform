# docs/

Team documentation for the car-rental platform.

> **Note on Claude Code:** these are *human/team* docs. Claude Code does **not** auto-read arbitrary
> markdown — the only auto-loaded memory file is `CLAUDE.md`. Docs here become visible to Claude when a
> `CLAUDE.md` pulls them in with an `@import`, e.g. the root `CLAUDE.md` imports `@docs/ARCHITECTURE.md`.

## Contents

| File | Purpose | Loaded by Claude? |
|------|---------|-------------------|
| `ARCHITECTURE.md` | System overview, the 3 apps, data flow, API surface, roles | Yes — `@`-imported by root `CLAUDE.md` |
| `plan-template.md` | Template to copy per feature into `plans/<feature>.md` | No (reference it explicitly when planning) |
| `decisions/` | Architecture Decision Records (ADRs) | No |
| `*.pdf` | Scope of Work (SOW) | No (binary) |

## Planning a feature

There is **no** magic `plan.md` / `plan-design.md` in Claude Code. To plan a feature:

1. Copy `plan-template.md` → `docs/plans/<feature-name>.md` and fill it in, **or**
2. Use Claude Code's built-in **plan mode** (it writes a plan you approve before any code).

Record any significant, hard-to-reverse decision as an ADR in `decisions/`.
