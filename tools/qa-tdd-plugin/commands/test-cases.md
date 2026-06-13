---
description: Produce a prioritized test-case matrix for a feature, endpoint, screen, or module.
argument-hint: <target — e.g. "backend auth" or "mobile login screen">
---

Use the **writing-test-cases** skill to build a complete test-case matrix for: **$ARGUMENTS**

1. Read the relevant source for `$ARGUMENTS` first (controllers/routes/screens/slices) so cases map to real code.
2. Walk EVERY category in the taxonomy: happy, boundary/edge, negative/invalid, auth/RBAC, ownership,
   error paths, idempotency/state, security (pull from the **security-review** skill), concurrency.
3. Output a table with: `id, module, title, type, priority (P0/P1/P2), steps, expected`. Mark P0 first.
4. Note any category you deliberately skip and why.

Offer to feed these rows into `/qa-tdd:qa-run` or `/qa-tdd:test-report` to produce the .xlsx.
