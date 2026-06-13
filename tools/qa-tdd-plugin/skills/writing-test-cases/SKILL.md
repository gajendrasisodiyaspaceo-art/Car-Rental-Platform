---
name: writing-test-cases
description: Use when planning QA coverage, authoring a test-case matrix, or deciding what scenarios to test for a feature, endpoint, screen, or bugfix in the car-rental platform.
---

# Writing Test Cases

## Overview

Before writing tests or running QA, enumerate the cases so nothing is missed. Coverage is not "I wrote some
tests" — it is "every category below was considered, and each was either covered or consciously skipped with a
reason." Each case becomes a row in the QA report (see `[[qa-test-report]]`).

## The coverage taxonomy — walk every row for each target

| Category | What it catches | Example (auth) |
|----------|-----------------|----------------|
| **Happy path** | Core behavior works | Valid register → 201 + user + token |
| **Boundary / edge** | Off-by-one, limits, empty/huge inputs | password exactly 6 chars; name length 2; empty list |
| **Negative / invalid** | Bad input is rejected cleanly | missing email; malformed email; wrong-typed body |
| **Auth / RBAC** | Right roles only (customer/provider/admin) | customer hits provider-only route → 403; no token → 401 |
| **Ownership** | Users can't touch others' data | provider A reads provider B's bookings |
| **Error paths** | Failures handled, no crashes/leaks | DB down; duplicate email → 400 not 500 |
| **Idempotency / state** | Repeats & order are safe | verify OTP twice; double-submit booking |
| **Security** | See `[[security-review]]` | OTP brute force; NoSQL injection; token tampering |
| **Concurrency** | Races | two bookings for the last vehicle |

## Each test case needs

- `id` — stable, e.g. `AUTH-REG-01`
- `module` — `auth`, `booking`, `vehicle`, `web-dashboard`, `mobile-login`…
- `title` — one line, behavior-focused
- `type` — `happy | edge | negative | rbac | security | error | idempotency`
- `priority` — `P0 | P1 | P2`
- `steps` — terse repro
- `expected` — observable result (status, shape, side effect)
- `actual` / `status` — filled after running (`pass | fail | skip | blocked`)
- `severity` — for failures (`critical | high | medium | low`)
- `notes`

## Prioritize

P0 = auth, payments/booking integrity, data exposure, RBAC. P1 = main user flows. P2 = cosmetic/edge.
Write P0 tests first. A feature isn't "tested" until its P0 cases are green.

## This codebase — high-value targets

- **Backend**: `auth` (register/login/verify-otp/me), `booking` lifecycle + OTP pickup/return,
  `vehicle`/`category`/`branch` CRUD with provider scoping, `middleware/auth.ts` (authenticate/authorize),
  `services/otp.service.ts`.
- **Web**: ProtectedRoute redirects, login flow, Redux slices, role-gated dashboard pages.
- **Mobile**: login + OTP screens, booking flow, auth slice, token persistence.

## Related skills

- `[[test-driven-development]]` — turn each P0 row into a RED test first.
- `[[security-review]]` — supplies the security rows.
- `[[qa-test-report]]` — the rows here map 1:1 to the xlsx report schema.
