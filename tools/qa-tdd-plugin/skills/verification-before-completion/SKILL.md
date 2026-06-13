---
name: verification-before-completion
description: Use when about to claim a feature works, a test passes, a bug is fixed, or QA is complete — before asserting success to the user.
---

# Verification Before Completion

## The Rule

**Evidence before claims, always.** Never say "done", "passing", "fixed", or "works" without running a fresh
command and reading its actual output and exit code.

> Exhaustion and confidence are not evidence. Output is.

## The gate (run before every completion claim)

1. Name the verification command (`npm test`, `npm run typecheck`, `npm run lint`, the security checklist).
2. Run it fresh — now, not "earlier". No stale memory of a prior run.
3. Read the FULL output and the exit code.
4. Confirm output actually matches the claim — green count, zero failures, no skipped P0 cases, clean exit.
5. Only then assert. Quote the relevant output line when you report.

## For this codebase, "verified" means

- `cd <app> && npm test` → exits 0, expected number of tests pass, **no** open-handle / unhandled-rejection
  warnings (common with Mongo connections — close them in teardown).
- `npm run typecheck` (backend) and `npm run lint` (backend/web) → clean.
- Security findings from `[[security-review]]` either fixed (with a regression test) or logged in the report.
- The xlsx report was actually generated and the file exists at the reported path.

## Red flags — stop and verify

- "should work" / "probably passes" / "I think that's fixed"
- claiming success right after editing without re-running
- reporting a pass-rate you didn't compute from real output
- saying the report was generated without confirming the file exists

## Related skills

- `[[test-driven-development]]` — Verify-RED and Verify-GREEN are instances of this gate.
- `[[qa-test-report]]` — fill `actual`/`status` from real run output, never guesses.
