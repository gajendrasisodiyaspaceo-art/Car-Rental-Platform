---
description: Drive a strict RED→GREEN→REFACTOR cycle for one feature or bugfix.
argument-hint: <feature or bug to implement>
---

Use the **test-driven-development** skill and follow it strictly for: **$ARGUMENTS**

Process:
1. If the target app has no test framework yet, STOP and tell me which one is needed and the exact install
   command — do not install it yourself (repo rule: ask before installing deps).
2. **RED** — write ONE minimal failing test for the next behavior of `$ARGUMENTS`. Use real code over mocks
   (backend: Supertest + mongodb-memory-server against the real app).
3. Run it. Show me it fails, and confirm it fails for the *right reason* (assertion, not a wiring error).
4. **GREEN** — write the simplest code to pass. Run the full suite; show clean green output.
5. **REFACTOR** — tidy while staying green.
6. Repeat one behavior at a time until `$ARGUMENTS` is complete.

Before claiming done, apply the **verification-before-completion** skill: run the suite fresh and quote the result.
