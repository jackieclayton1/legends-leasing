# Legends Leasing: web front end

Vite + React + Tailwind front end for the Legends Leasing Expo/Vercel API (Clerk + Neon).
Put this folder in the repo as `web/`.

## Run locally

1. Terminal A, repo root: `npx expo start` (serves the API on :8081)
2. Terminal B, `web/`:
   ```bash
   cp .env.example .env.local   # set VITE_CLERK_PUBLISHABLE_KEY
   npm install
   npm run dev
   ```
Vite proxies `/api/*` to the Expo server, so no CORS setup is needed in dev.

## What talks to the back end

| Front end | Back end route |
|---|---|
| Sign-in (`pages/Login.jsx`) | Clerk email code (same Clerk app as Expo) |
| `lib/AuthContext.jsx` | `GET /api/eligibility`, `POST /api/verification/start` (Bearer Clerk token) |
| `components/RequireAccess.jsx` | Gates /choose, /list, /dashboard on `canAccess` |

## Production

1. Deploy `web/` as its own Vercel project (build `npm run build`, output `dist`).
2. Set `VITE_API_URL` to the Expo API deployment and `VITE_CLERK_PUBLISHABLE_KEY`.
3. Copy `backend-patch/start+api.ts` over `src/app/api/verification/start+api.ts` in the Expo project (adds CORS), and set `ALLOWED_ORIGIN` there.
4. In the Clerk dashboard, add the web site's URL to allowed origins.

## Not wired yet

There are no listing, favorite, or draft routes in the back end. Those still live in
`localStorage` (`lib/AppContext.jsx`) plus `lib/mockData.js`. Add routes + tables, then
swap the bodies of `addListing` / `getListing` / `toggleFavorite` etc. for `fetch` calls.
