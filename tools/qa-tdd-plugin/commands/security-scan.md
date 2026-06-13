---
description: Run the security-review checklist against an app or path and emit structured findings.
argument-hint: [app or path — defaults to backend]
allowed-tools: Read, Grep, Glob, Bash
---

Use the **security-review** skill to audit: **${ARGUMENTS:-backend}**

1. Read the targeted code (auth, JWT, OTP, models, middleware, routes, mobile token storage).
2. Verify the known repo findings FIRST (OTP `Math.random()`, `devOtp` in register response, no rate
   limiting, weak password min, JWT hardening, full-user serialization, AsyncStorage token) — confirm each
   against the actual current code with file:line.
3. Walk the standard checklist (AuthN, RBAC + ownership, input validation/mass-assignment, NoSQL injection,
   secrets, headers/CORS, error leakage, `npm audit`).
4. Output a findings array: `{ id, category, title, severity, location, description, recommendation, status }`.

Offer to: (a) write regression tests + fix the top findings via `/qa-tdd:tdd`, and
(b) export findings to .xlsx via `/qa-tdd:test-report`.
