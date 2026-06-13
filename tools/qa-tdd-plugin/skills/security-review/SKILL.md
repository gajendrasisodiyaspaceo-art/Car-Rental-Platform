---
name: security-review
description: Use when reviewing security of the car-rental platform — auth, JWT, OTP, MongoDB queries, role checks, secrets, mobile token storage — or when running a security scan or QA sweep.
---

# Security Review

## Overview

Walk this checklist against the changed/targeted code. For each item, decide **pass / fail / N-A**, record
the file:line, severity, and a concrete fix. Findings feed the **Security Findings** sheet of the QA report
(see `[[qa-test-report]]`). Default to suspicion: if you can't prove it's safe, mark it for follow-up.

Severity: `critical` (auth bypass, data exposure, RCE) · `high` (brute force, injection, weak crypto) ·
`medium` (info leak, missing hardening) · `low` (defense-in-depth).

## Known findings in this repo (verify these first — they are real)

1. **OTP is not cryptographically random** — `backend/src/services/otp.service.ts` uses
   `Math.random()` for the 6-digit code. **high**. Fix: `crypto.randomInt(100000, 1000000)`.
2. **OTP leaked in API response** — `auth.controller.ts` `register()` returns `devOtp` in the JSON body.
   **high** (account takeover without SMS access). Fix: gate behind a dev flag and never send in prod;
   deliver via SMS/email instead.
3. **No rate limiting / lockout** — `login`, `verify-otp`, `register` have no throttle (`express-rate-limit`
   is not a dependency). **high** — enables credential stuffing and 6-digit OTP brute force
   (1e6 space, no cap). Fix: add `express-rate-limit` + per-account attempt counter / OTP attempt cap.
4. **Weak password policy** — `registerSchema` allows `password: z.string().min(6)`. **medium**.
   Fix: raise to ≥8–12, consider complexity/breached-password check.
5. **JWT hardening** — review `backend/src/utils/jwt.ts`: strong secret (env, not committed), explicit
   `expiresIn`, pinned `algorithms: ['HS256']` on verify (prevent `alg:none`/confusion). **high** if missing.
6. **Sensitive data in responses** — `me()` returns the full user document; ensure `password` has
   `select: false` and is never serialized; avoid returning internal fields. **medium**.
7. **Mobile token storage** — JWT stored in `AsyncStorage` (plaintext). **medium**. Fix: use
   `expo-secure-store` (Keychain/Keystore).

## Standard checklist (per change)

- **AuthN**: every protected route uses `authenticate`; tokens validated, expiry enforced, no token in URLs/logs.
- **AuthZ / RBAC**: `authorize(...roles)` on every provider/admin route; ownership checks so a provider can't
  read/modify another provider's vehicles/bookings (`utils/scope.ts`). Test the negative case.
- **Input validation**: every route body/params/query goes through a Zod schema (`middleware/validate.ts`);
  reject unknown fields to prevent **mass assignment** into `User.create`/`Model.create`.
- **NoSQL injection**: never pass raw `req.body`/`req.query` objects straight into Mongoose filters
  (`{ email: req.query.email }` where the value is an object enables `$gt`-style operators). Cast/whitelist.
- **Secrets**: only in env via `config/env.ts`; `.env` git-ignored; no secrets in code, logs, or responses.
- **Transport/headers**: Helmet enabled; CORS is an allowlist, not `*` with credentials; HTTPS in prod.
- **Error handling**: errors go through the central handler; never leak stack traces / Mongo errors to clients.
- **Dependencies**: `npm audit` clean; no known-vuln packages.
- **PII / payments**: minimize stored PII; never log card/payment data; OTP + booking flows can't be replayed.

## Output

For each finding produce: `{ id, category, title, severity, location (file:line), description, recommendation,
status }`. Pass this array to the report generator. Confirm a fix with a failing-then-passing test
(`[[test-driven-development]]`) — security bugs get regression tests.

## Related skills

- `[[writing-test-cases]]` — security rows in the matrix.
- `[[verification-before-completion]]` — re-run after fixes; prove the hole is closed.
