---
name: qa-test-report
description: Use when generating an Excel (.xlsx) QA / test-result report, exporting test-case results, or summarizing a QA run for the car-rental platform.
---

# QA Test Report (.xlsx)

## Overview

Turns QA results into a styled Excel workbook via the bundled generator
`${CLAUDE_PLUGIN_ROOT}/scripts/generate-xlsx.js` (uses `exceljs`, installed inside the plugin — the app
package.json files are never touched). You assemble a results JSON, then run the generator.

## Step 1 — assemble the results JSON

Conform to `${CLAUDE_PLUGIN_ROOT}/scripts/results.schema.json`:

```jsonc
{
  "meta":    { "project": "car-rental-platform", "app": "backend", "date": "2026-06-13", "commit": "abc1234" },
  "summary": { "total": 12, "passed": 9, "failed": 2, "skipped": 1, "coveragePct": 74 },
  "testCases": [
    { "id": "AUTH-REG-01", "module": "auth", "title": "valid register returns 201 + token",
      "type": "happy", "priority": "P0", "steps": "POST /api/v1/auth/register valid body",
      "expected": "201, body.data.token present", "actual": "201, token present",
      "status": "pass", "severity": "", "notes": "" }
  ],
  "security": [
    { "id": "SEC-OTP-01", "category": "Weak crypto", "title": "OTP uses Math.random()",
      "severity": "high", "location": "backend/src/services/otp.service.ts:7",
      "description": "6-digit OTP generated with Math.random(), predictable",
      "recommendation": "Use crypto.randomInt(100000, 1000000)", "status": "open" }
  ]
}
```

- `status` ∈ `pass | fail | skip | blocked`. `severity` ∈ `critical | high | medium | low` (blank if pass).
- Fill `actual`/`status` from REAL run output — see `[[verification-before-completion]]`. Never invent results.
- Keep `summary` consistent with the rows (counts should add up).

## Step 2 — generate the workbook

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-xlsx.js" <results.json> [output.xlsx]
```

- Pass the JSON as a path argument, or pipe it on stdin.
- Default output: `${CLAUDE_PROJECT_DIR}/qa-reports/qa-report-<app>-<date>.xlsx` (dir auto-created).
- The script prints the absolute output path; report that path to the user and confirm the file exists.

## Output workbook

Four sheets: **Summary** (counts, pass-rate %, color-coded), **Test Cases** (full matrix, status-colored),
**Security Findings** (severity-colored), **Coverage** (per-module pass/fail/rate).

## Related skills

- `[[writing-test-cases]]` — produces the `testCases` rows.
- `[[security-review]]` — produces the `security` rows.
