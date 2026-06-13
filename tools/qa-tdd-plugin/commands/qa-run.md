---
description: Full QA sweep — framework check, run tests, security review, then export an .xlsx report. Pass "all" to sweep every app at once.
argument-hint: [backend | web | mobile | all — defaults to all]
allowed-tools: Read, Grep, Glob, Bash, Write
---

Run a complete QA sweep for: **${ARGUMENTS:-all}**. Orchestrate the plugin's skills end-to-end.

**Targets.** If the argument is `all` (or empty), run the full sweep for EACH app in one go —
`backend`, `apps/web`, `apps/mobile` — by repeating steps 1–6 per app. For the whole run:
- Dispatch the `qa-engineer` and `security-reviewer` agents per app (they can run in parallel across apps).
- Produce one `.xlsx` per app, PLUS a combined `qa-report-all-<date>.xlsx` (merge each app's rows; tag the
  `module` column with the app name) so you have a single file covering everything.
- End with one consolidated summary table: per-app pass-rate, P0 failures, and top security findings.

Otherwise run for the single named app. Per app:

1. **Framework check.** Detect whether the target app has a test runner + `test` script.
   - If MISSING: report it and offer the standard setup (do NOT install unprompted — repo rule):
     - backend → `jest ts-jest @types/jest supertest @types/supertest mongodb-memory-server`
     - web → `vitest @testing-library/react @testing-library/jest-dom jsdom`
     - mobile → `jest-expo jest @testing-library/react-native`
     Stop here for confirmation unless I already approved scaffolding.
2. **Test cases.** Use **writing-test-cases** to build/confirm the matrix for the app's key modules.
3. **Run.** If a runner exists: `npm test`, plus `npm run typecheck` / `npm run lint` where defined.
   Capture real pass/fail/skip counts and per-test outcomes. Apply **verification-before-completion** —
   read actual output, don't guess.
4. **Security.** Use **security-review** to produce the findings array for the app.
5. **Assemble results JSON** per the **qa-test-report** schema (meta, summary, testCases, security). Keep
   counts consistent.
6. **Export.** Run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-xlsx.js" <results.json>
   ```
   Confirm the output file exists and report its absolute path.
7. **Summarize**: pass-rate, P0 failures, top security findings, and the report path.
