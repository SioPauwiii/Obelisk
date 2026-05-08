# Privy Auth Integration Setup

This guide explains how to run the Next.js frontend and Express TypeScript backend with Privy authentication.

## 1) Install required packages

### Frontend (`Obelisk/`)

```bash
npm install @privy-io/react-auth @tanstack/react-query
```

### Backend (`Obelisk/server/`)

```bash
npm install @privy-io/server-auth jsonwebtoken
```

> `jsonwebtoken` is optional for this implementation (Privy server SDK handles verification), but it is installed if you want to decode or inspect JWTs in custom flows.

## 2) Configure Privy dashboard

1. Go to the Privy Dashboard: `https://dashboard.privy.io`.
2. Create a new app (or open your existing app).
3. In login methods, enable **Wallet**.
4. Add your allowed frontend domains (for local dev include your local app URL, e.g. `http://localhost:3000`).
5. Copy your **App ID**.
6. Copy your **App Secret** from the dashboard's credentials section.

## 3) Configure environment variables

## Frontend `.env.local` (in `Obelisk/`)

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Backend `.env` (in `Obelisk/server/`)

```env
API_VERSION=v1
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
TRUST_PROXY=0
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

## 4) Run apps

### Start backend

```bash
cd server
npm run dev
```

### Start frontend

```bash
npm run dev
```

## 5) What was implemented

- Frontend provider setup (`PrivyProvider` + `QueryClientProvider`)
- `usePrivyAuth` hook with `getAccessToken()` integration
- Authenticated fetch wrapper that sends:
  - `Authorization: Bearer <privy_access_token>`
- Login page with **Connect Wallet**
- Protected dashboard route with user wallet info
- Logout clears:
  1. Privy session (`logout()`)
  2. TanStack Query cache (`queryClient.clear()`)
- Backend JWT middleware using `@privy-io/server-auth`
- Protected routes:
  - `GET /api/v1/auth/me`
  - `GET /api/v1/auth/verify`

## 6) Verification checklist

1. Open `/signin`, click **Connect Wallet**.
2. After successful login, verify redirect to `/dashboard`.
3. Confirm dashboard shows wallet address.
4. Confirm backend-protected data loads from `/api/v1/auth/me`.
5. Click **Logout** and verify:
   - session is removed
   - query cache is empty
   - redirect to `/signin`
