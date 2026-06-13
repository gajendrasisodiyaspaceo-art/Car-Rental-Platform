# Plan: <feature name>

> Copy this file to `docs/plans/<feature-name>.md` and fill it in before building.
> (This replaces the idea of a `plan.md` / `plan-design.md` — there is no auto-magic plan file in Claude Code.)

## Context
Why are we doing this? The problem/need, what prompted it, the intended outcome. Link the SOW section or issue.

## Scope
- **In scope:** …
- **Out of scope / non-goals:** …
- Affected apps: ☐ backend ☐ apps/web ☐ apps/mobile

## Design
The approach. Data model changes (Mongoose models), API endpoints (`/api/v1/...`, request/response shape),
state changes (Redux slices), UI/screens. Reuse existing utilities where possible
(`asyncHandler`, `ApiError`, `validate`, Axios client, typed hooks).

## Test plan (TDD)
List the test cases first (happy / edge / negative / RBAC / ownership / error / idempotency / security).
Mark P0/P1/P2. Write the failing test before the code. See the `qa-tdd` plugin (`/qa-tdd:test-cases`).

## Security
Auth/RBAC impact, input validation, data exposure, secrets. Run `/qa-tdd:security-scan` on touched code.

## Rollout / verification
How to verify end-to-end (commands to run, manual steps). Migrations/seed changes. Rollback plan.

## Decisions
Any significant, hard-to-reverse choice → record an ADR in `docs/decisions/`.
