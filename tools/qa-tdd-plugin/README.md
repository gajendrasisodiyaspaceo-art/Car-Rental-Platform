# qa-tdd — QA & TDD plugin for Claude Code

A self-contained Claude Code plugin that enforces **test-driven development**, runs structured **QA**
(including a **security review** tuned to this codebase), authors **test cases**, and exports results to a
styled **Excel (`.xlsx`)** report.

Modeled on the [`superpowers`](https://github.com/obra/superpowers) plugin's skills-based, gate-driven
discipline ("no production code without a failing test first", "evidence before claims"), with added
commands, QA/security subagents, and an xlsx reporter.

## What's inside

| Component | Purpose |
|-----------|---------|
| **Skills** | `test-driven-development`, `writing-test-cases`, `security-review`, `verification-before-completion`, `qa-test-report` — auto-invoked by Claude when relevant. |
| **Commands** | `/qa-tdd:tdd`, `/qa-tdd:test-cases`, `/qa-tdd:security-scan`, `/qa-tdd:qa-run`, `/qa-tdd:test-report`. |
| **Agents** | `qa-engineer` (executes a test matrix), `security-reviewer` (adversarial security pass). |
| **Hooks** | `SessionStart` note; non-blocking TDD reminder on `Write`/`Edit` of untested source. |
| **Scripts** | `generate-xlsx.js` (+ bundled `exceljs`), `results.schema.json`. |

The plugin keeps its only dependency (`exceljs`) inside `scripts/` — the app `package.json` files are never
modified.

## Install

```bash
# 1. Install the report generator's dependency (one time, inside the plugin only)
npm install --prefix tools/qa-tdd-plugin/scripts

# 2. Register the local marketplace and install the plugin
#    (run inside Claude Code)
/plugin marketplace add ./tools/qa-tdd-plugin
/plugin install qa-tdd@qa-tdd-local
```

Validate the plugin structure at any time:

```bash
claude plugin validate tools/qa-tdd-plugin
```

## Commands

| Command | What it does |
|---------|--------------|
| `/qa-tdd:tdd <feature>` | Drives a strict RED→GREEN→REFACTOR cycle for one feature/bugfix. |
| `/qa-tdd:test-cases <target>` | Produces a prioritized test-case matrix (happy/edge/negative/RBAC/security/…). |
| `/qa-tdd:security-scan [app]` | Runs the security checklist; emits structured findings. Defaults to `backend`. |
| `/qa-tdd:qa-run [app]` | Full sweep: framework check → run tests → security → assemble JSON → `.xlsx`. |
| `/qa-tdd:test-report <results.json>` | Generates the `.xlsx` from an existing results JSON. |

## Report generator (standalone)

```bash
node tools/qa-tdd-plugin/scripts/generate-xlsx.js <results.json> [output.xlsx]
# or pipe JSON:
cat results.json | node tools/qa-tdd-plugin/scripts/generate-xlsx.js -
```

Default output: `<project>/qa-reports/qa-report-<app>-<date>.xlsx`. The workbook has four sheets —
**Summary**, **Test Cases**, **Security Findings**, **Coverage** — with color-coded status/severity.

## Results JSON shape

See `scripts/results.schema.json`. Minimal example:

```jsonc
{
  "meta":    { "project": "car-rental-platform", "app": "backend", "date": "2026-06-13" },
  "summary": { "total": 3, "passed": 2, "failed": 1, "skipped": 0, "coveragePct": 67 },
  "testCases": [
    { "id": "AUTH-REG-01", "module": "auth", "title": "valid register returns 201 + token",
      "type": "happy", "priority": "P0", "steps": "POST /auth/register",
      "expected": "201 + token", "actual": "201 + token", "status": "pass", "severity": "", "notes": "" }
  ],
  "security": [
    { "id": "SEC-OTP-01", "category": "Weak crypto", "title": "OTP uses Math.random()",
      "severity": "high", "location": "backend/src/services/otp.service.ts:7",
      "description": "Predictable 6-digit OTP", "recommendation": "Use crypto.randomInt", "status": "open" }
  ]
}
```

## Notes

- The plugin does **not** install test frameworks automatically. `/qa-tdd:qa-run` detects a missing runner
  and proposes the standard setup (Jest+Supertest backend, Vitest+RTL web, jest-expo+RNTL mobile) for you to
  approve — honoring the repo rule *"ask before installing new dependencies"*.
- Security checks are pre-seeded with real issues found in this repo (OTP `Math.random()`, `devOtp` leaked in
  the register response, no rate limiting, weak password minimum, mobile token in `AsyncStorage`).
