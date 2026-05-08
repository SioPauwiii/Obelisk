# Obelisk Setup Guide (Full App)

This guide covers everything needed to run Obelisk end-to-end:

- Next.js app (main app)
- Supabase database + auth-backed API routes
- Privy authentication
- Lighthouse IPFS uploads
- Optional Express server in `server/`

## 1. Prerequisites

1. Install Node.js 20+.
2. Install npm (bundled with Node).
3. Have a Supabase project ready.
4. Have a Privy app ready.
5. Have a Lighthouse API key.
6. Use HTTPS or localhost for camera access (required by browsers).

## 2. Install Dependencies

From repo root:

```bash
npm install
```

Optional backend server dependencies:

```bash
cd server
npm install
cd ..
```

## 3. Environment Variables (Root App)

Create `.env` (or `.env.local`) at repo root with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

NEXT_PUBLIC_LIGHTHOUSE_API_KEY=

# Optional (only needed for smart account / server integration flows)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL=
NEXT_PUBLIC_PIMLICO_API_KEY=
```

Notes:

- `SUPABASE_JWT_SECRET` must match your Supabase project's JWT secret.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client code.
- `NEXT_PUBLIC_LIGHTHOUSE_API_KEY` is used by the capture flow in MVP.

## 4. Supabase Database Setup

1. Open Supabase SQL editor.
2. Run the SQL in `supabase.editor`.
3. Confirm these tables exist:

- `public.users`
- `public.posts`

The app APIs rely on:

- `users.privy_did` for identity mapping
- `posts` for feed rendering and capture uploads

## 5. Privy Setup

In Privy dashboard:

1. Create/select app.
2. Enable login methods you use (Google, Apple, Email, Wallet as needed).
3. Add allowed origins (at least `http://localhost:3000`).
4. Copy values into:

- `NEXT_PUBLIC_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`

## 6. Run the Main App

```bash
npm run dev
```

Open:

- `http://localhost:3000`

Recommended validation:

1. Sign in.
2. Complete onboarding.
3. Open `/capture`.
4. Grant camera permission once.
5. Return to `/capture` and verify camera auto-starts.
6. Verify capture limit: max 5 captures per 24 hours.
7. Archive a post and verify it appears in `/feed`.

## 7. Capture Behavior (Current)

Camera flow now does the following:

- Auto-starts camera when browser permission state is already `granted`.
- Enforces `5` captures per rolling 24-hour window (stored in browser local storage).
- Blocks additional captures after limit is reached and shows reset time.

Storage key used in browser:

- `obelisk-camera-capture-history-v1`

## 8. Optional Express Server Setup (`server/`)

Only needed if you are using routes under `server/src` (legacy or separate backend APIs).

Create `server/.env`:

```env
API_VERSION=v1
PRIVY_APP_ID=
PRIVY_APP_SECRET=
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
TRUST_PROXY=0
```

Run server:

```bash
cd server
npm run dev
```

Health check:

- `http://localhost:4000/api/v1/health`

## 9. Production Build Check

From root:

```bash
npm run build
```

If build passes, routing + API compilation is healthy.

## 10. Common Issues

1. Camera not starting:

- Ensure site is localhost/HTTPS.
- Check browser camera permission for the site.

2. Capture blocked unexpectedly:

- You may have hit the 5-per-24h limit.
- Clear `obelisk-camera-capture-history-v1` in local storage only for local testing.

3. Post creation fails with 401:

- Verify auth cookie is being set by `/api/auth/wallet-session`.
- Verify Privy and Supabase secrets are correct.

4. Post creation fails with 500:

- Verify `posts` table exists and columns match `supabase.editor`.
- Verify `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET`.
