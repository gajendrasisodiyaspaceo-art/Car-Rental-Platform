# Car Rental Platform

White-label car rental platform. See [`docs/`](./docs) for the full scope of work.

## Structure

| Path           | Stack                                   | Role                                    |
| -------------- | --------------------------------------- | --------------------------------------- |
| `backend`      | Node.js + Express + MongoDB, TypeScript | REST API (`/api/v1`), multi-role JWT    |
| `apps/web`     | React + Vite + Redux Toolkit, TS        | Service-provider dashboard              |
| `apps/mobile`  | React Native (Expo) + Redux Toolkit, TS | Customer app (iOS + Android)            |

## Getting started

```bash
# install everything
npm run install:all

# run backend + web together
npm run dev

# or individually
npm run backend   # http://localhost:4000
npm run web       # http://localhost:5173
npm run mobile    # Expo dev server
```

Each app has its own `.env` — copy the `.env.example` in each folder and fill in values.

### Backend prerequisites

A MongoDB instance. Locally:

```bash
brew services start mongodb-community   # or: mongod --config /opt/homebrew/etc/mongod.conf
```

Default connection string is `mongodb://127.0.0.1:27017/car_rental` (override via `backend/.env`).

`Logins (password123): admin@demo.io, provider@demo.io, customer@demo.io  for mobile customer@demo.io / password123`
