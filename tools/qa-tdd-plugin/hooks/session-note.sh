#!/usr/bin/env bash
# SessionStart hook: advertise the QA/TDD plugin. Non-blocking; just injects context.
cat <<'JSON'
{
  "additionalContext": "qa-tdd plugin active. Commands: /qa-tdd:tdd (RED-GREEN-REFACTOR), /qa-tdd:test-cases (matrix), /qa-tdd:security-scan, /qa-tdd:qa-run (full sweep + .xlsx), /qa-tdd:test-report (.xlsx from JSON). Discipline: no production code without a failing test first; evidence before claims."
}
JSON
