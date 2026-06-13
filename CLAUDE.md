# Car Rental Platform

White-label car rental platform. Full feature spec (SOW) is the PDF in `docs/`.
Architecture reference: @docs/ARCHITECTURE.md

## Architecture (monorepo)
- apps/mobile  — React Native customer app (iOS + Android)
- apps/web     — React.js service-provider dashboard
- backend      — Node.js + Express REST API, MongoDB

## Project memory map
Each package has its own `CLAUDE.md` that loads when you work in that folder:
- `backend/CLAUDE.md`   — API patterns, models, auth, security
- `apps/web/CLAUDE.md`  — React/Vite/Redux dashboard conventions
- `apps/mobile/CLAUDE.md` — React Native/Expo conventions

## Commands
- `npm run dev`            — backend + web together (root)
- `npm run backend|web|mobile` — run one app (root)
- Per app: `npm run lint`, `npm run typecheck` (backend), `npm test` (once a test runner is added)

## Roles
- Customer: mobile app — browse, book, OTP pickup, return
- Service Provider: web dashboard — fleet, bookings, OTP gen, reports

## Conventions
- TypeScript everywhere
- Functional components + hooks only
- State: Redux Toolkit (or Context for local)
- Auth: JWT, multi-role
- API: RESTful, versioned (/api/v1)

## Rules
- Don't add excessive comments
- Don't create files outside the relevant app folder
- Ask before installing new dependencies
