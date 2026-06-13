# Backend (Node + Express + MongoDB)

Architecture reference: @../docs/ARCHITECTURE.md

## Stack
- Express 4, Mongoose 8 (MongoDB), TypeScript (strict, CommonJS, target ES2021)
- Auth: JWT (`jsonwebtoken`) + bcryptjs; Validation: Zod; Security: Helmet + CORS; Logging: Morgan

## Structure (`src/`)
- `app.ts` — Express app factory · `server.ts` — HTTP startup · `seed.ts` — DB seeding
- `config/`      — `env.ts` (dotenv), `db.ts` (Mongo connection)
- `controllers/` — request handlers (auth, vehicle, booking, branch, category)
- `routes/`      — Express routers; `index.ts` aggregates under `/api/v1`
- `models/`      — Mongoose schemas (User, Vehicle, VehicleCategory, Booking, Branch, Payment, Otp)
- `middleware/`  — `auth.ts` (authenticate/authorize), `validate.ts` (Zod), `error.ts` (notFound/errorHandler)
- `services/`    — business logic (`otp.service.ts`)
- `utils/`       — `jwt.ts` (signToken/verifyToken), `ApiError.ts`, `asyncHandler.ts`, `scope.ts`
- `types/`       — `ROLES`, `Role`, shared types

## Conventions
- Wrap async handlers with `asyncHandler` so errors reach the central `errorHandler`.
- Throw `ApiError.badRequest/unauthorized/forbidden/notFound(...)` — never `res.status().json()` for errors.
- Validate every route's body/params/query with a Zod schema via `validate(schema)`.
- API is versioned: mount under `/api/v1`. Responses use `{ success, data | message }`.
- RBAC: protect routes with `authenticate`, then `authorize('provider' | 'admin' | ...)`. Providers must
  only see their own data — enforce ownership scoping (`utils/scope.ts`), don't trust the client.
- Roles live in `types` (`ROLES`): customer / provider / admin.

## Commands
- `npm run dev` (ts-node-dev) · `npm run build` (tsc) · `npm start` (dist)
- `npm run seed` · `npm run typecheck` · `npm run lint`

## Security (must-fix items in this codebase)
- OTP must be crypto-random — use `crypto.randomInt(100000, 1000000)`, not `Math.random()` (`services/otp.service.ts`).
- Never return the OTP in an API response — remove `devOtp` from `register()` once delivery is wired.
- Add rate limiting / attempt caps on login, register, and OTP verify (brute-force).
- Strengthen the password policy (current `z.string().min(6)` is weak; prefer ≥8–12).
- Never serialize the password hash; keep `select: false` and shape responses explicitly.
- Pin JWT algorithm on verify, enforce expiry, keep the secret in env only.
- Don't pass raw `req.body`/`req.query` objects straight into Mongoose filters (NoSQL injection / mass assignment).

For QA/TDD on this app, see the `qa-tdd` plugin under `tools/qa-tdd-plugin/`
(`/qa-tdd:security-scan backend`, `/qa-tdd:qa-run backend`).
