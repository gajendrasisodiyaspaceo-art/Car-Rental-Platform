# Web Dashboard (React + Vite)

Architecture reference: @../../docs/ARCHITECTURE.md

Service-provider dashboard: fleet management, bookings, OTP generation, reports.

## Stack
- React 19 + Vite (ESM), TypeScript (strict)
- State: Redux Toolkit + react-redux
- Routing: React Router v7
- HTTP: Axios (`src/lib/api.ts`)
- Lint: ESLint flat config (`eslint.config.js`)

## Structure (`src/`)
- `pages/`      — route-level screens (LoginPage, DashboardPage, VehiclesPage, BookingsPage)
- `components/` — reusable UI + `ProtectedRoute`, `Layout`
- `app/`        — `store.ts` (Redux store), `hooks.ts` (typed `useAppDispatch`/`useAppSelector`)
- `features/`   — Redux Toolkit slices (authSlice, vehiclesSlice)
- `lib/`        — `api.ts` (Axios instance)

## Conventions
- Functional components + hooks only.
- All state goes through Redux Toolkit slices in `features/`; use the typed hooks from `app/hooks.ts`,
  never the raw `useDispatch`/`useSelector`.
- Call the API via the shared Axios client in `lib/api.ts` (attaches the JWT); don't hand-roll fetch.
- Guard authenticated/role-restricted routes with `ProtectedRoute`. This dashboard is provider/admin only —
  enforce the role, don't just hide UI.
- Store the JWT carefully (avoid leaking it; prefer in-memory + httpOnly where possible).

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm run preview`
