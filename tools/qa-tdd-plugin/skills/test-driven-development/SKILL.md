---
name: test-driven-development
description: Use when implementing any feature, fixing any bug, or changing behavior in the car-rental backend, web, or mobile app — before writing implementation code.
---

# Test-Driven Development

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you write implementation code before its test, delete it and start over from the test. No exceptions
for "simple" changes, "obvious" fixes, or "just a small refactor". The only carve-outs are throwaway
prototypes, generated code, and pure configuration — and even those need the human's explicit OK.

> If you didn't watch the test fail, you don't know if it tests the right thing.

## The Cycle: RED → GREEN → REFACTOR

1. **RED** — Write ONE minimal test that describes the next slice of behavior. Use real code, not mocks,
   wherever feasible (for the backend, use `mongodb-memory-server` + `supertest` against the real Express
   app rather than mocking Mongoose).
2. **Verify RED** — Run it. Confirm it fails, and that it fails for the *expected reason* (assertion failed),
   not a syntax error, a missing import, or a wiring mistake. A test that fails for the wrong reason proves nothing.
3. **GREEN** — Write the simplest code that makes the test pass. Resist building beyond the test.
4. **Verify GREEN** — Run the whole suite. All green, with clean output (no unhandled promise warnings,
   no open-handle leaks). Read the actual output; don't assume.
5. **REFACTOR** — Improve names, remove duplication, tighten types. Tests stay green throughout.

Repeat one behavior at a time.

## Per-app quick reference

| App | Test stack | Run |
|-----|-----------|-----|
| `backend` | Jest + ts-jest + Supertest + mongodb-memory-server | `npm test` (once scaffolded) |
| `apps/web` | Vitest + React Testing Library + jsdom | `npm test` |
| `apps/mobile` | jest-expo + @testing-library/react-native | `npm test` |

If the framework is not yet installed, STOP and tell the human which one is needed and the install command —
do not install dependencies unprompted (repo rule: ask before installing new dependencies). See
`@${CLAUDE_PLUGIN_ROOT}/commands/qa-run.md` for the scaffolding offer flow.

## What to test first (this codebase)

- **Backend controllers/services**: behavior through the route (Supertest) — status codes, response shape,
  DB side effects. e.g. `register` creates a user + issues OTP; `login` rejects bad credentials; `confirmOtp`
  rejects expired codes; `authorize()` blocks wrong roles.
- **Pure utils** (`utils/jwt.ts`, `utils/scope.ts`, `services/otp.service.ts`): unit tests, no I/O.
- **Web/mobile**: render + interaction via Testing Library; Redux slices as pure reducer tests.

## Common rationalizations (all forbidden)

- "It's too simple to test" → simple code still regresses; write the test.
- "I'll add tests after" → after never comes, and the test no longer drives the design.
- "The test is hard to write" → that's a design signal. Fix the seam, don't skip the test.
- "I already verified it manually" → manual checks aren't repeatable; encode them as a test.

## Related skills

- `[[writing-test-cases]]` — enumerate WHAT to test before you start the cycle.
- `[[verification-before-completion]]` — prove it's green before claiming done.
- `[[security-review]]` — security cases belong in the test matrix too.
