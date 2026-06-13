# Architecture

White-label car rental platform. Monorepo with three deployable parts plus a shared REST API.

## Components

```
┌────────────────────┐        ┌────────────────────┐
│  apps/mobile (RN)  │        │  apps/web (React)  │
│  Customer app      │        │  Provider dashboard│
└─────────┬──────────┘        └─────────┬──────────┘
          │  HTTPS / JWT                │
          └─────────────┬───────────────┘
                        ▼
              ┌────────────────────┐
              │  backend (Express) │   /api/v1
              │  REST API          │
              └─────────┬──────────┘
                        ▼
                ┌──────────────┐
                │   MongoDB    │  (Mongoose)
                └──────────────┘
```

- **apps/mobile** — Expo / React Native customer app: browse vehicles, book, OTP pickup, return.
- **apps/web** — React + Vite service-provider dashboard: fleet, bookings, OTP generation, reports.
- **backend** — Node + Express REST API, MongoDB via Mongoose. JWT auth, multi-role.

## Roles (RBAC)

| Role | Surface | Capabilities |
|------|---------|--------------|
| `customer` | mobile app | browse, book, OTP pickup, return |
| `provider` | web dashboard | manage own fleet, bookings, generate OTP, reports |
| `admin` | web dashboard | platform-wide management |

Roles are defined in `backend/src/types` (`ROLES`). Enforce with `authenticate` + `authorize(...roles)`;
providers must only access their own data (ownership scoping in `utils/scope.ts`).

## API surface (`/api/v1`)

- `auth` — `POST /register`, `POST /login`, `POST /verify-otp`, `GET /me`
- `vehicles`, `categories`, `branches` — CRUD (provider-scoped)
- `bookings` — booking lifecycle + OTP pickup/return
- `GET /health` — liveness

Response envelope: `{ success: boolean, data?: ..., message?: ... }`.

## Key flows

- **Auth**: register → bcrypt-hashed password, JWT issued, verification OTP created → verify OTP → `isVerified`.
- **Booking + OTP**: provider/customer flow uses one-time codes (`Otp` model, `otp.service.ts`) for
  pickup/return hand-off, with TTL expiry.

## Cross-cutting conventions

- TypeScript everywhere; functional components + hooks on the clients.
- State via Redux Toolkit.
- Validation via Zod at the API boundary; errors via `ApiError` + central error handler.

## Security baseline

See `backend/CLAUDE.md` for the current must-fix list (crypto-random OTP, no OTP in responses, rate
limiting, password policy, JWT hardening, no NoSQL injection / mass assignment, mobile token in
SecureStore). QA tooling lives in `tools/qa-tdd-plugin/`.
