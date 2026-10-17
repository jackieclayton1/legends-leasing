# Legends Leasing

Legends Leasing is the premier way to find subleasers and have your apartment sublet at The University of Alabama. Soon to arrive on other campuses. ETA: Spring 2027.

This platform ensures safety for the subleaser the entire time, from uploading your apartment for sublease for them to receiving payment on time every month. It also ensures safety for the one staying in the subleased apartment with .edu verification and secure payment platforms with no unusual payment processing delays.

## Run locally

One Expo Router project provides the iOS, Android, and web clients plus an in-project API route.

```bash
npx expo start
```

The home screen calls `GET /api/health`. With no API environment variable, Expo routes that relative request to the local Expo server during development.

## Use the deployed API from mobile development

Copy `.env.example` to `.env` and set your Vercel production or preview origin:

```bash
EXPO_PUBLIC_API_URL=https://your-project.vercel.app
```

Restart Expo after changing the variable. `EXPO_PUBLIC_*` values are bundled into the app, so do not put secrets in this variable. The deployed URL is public by design; server-only secrets belong in Vercel environment variables and are read only by API route code.

## Vercel deployment

`vercel.json` uses Expo Router's Vercel server adapter. It exports client assets to `dist/client`, includes the server bundle from `dist/server`, and sends both page and API requests to the server handler. The API route is therefore deployed with the web app.

1. Import this repository in Vercel, or run `npx vercel` from the project root.
2. Keep the build command from `vercel.json`: `npx expo export --platform web`.
3. After Vercel gives you a URL, add it as `EXPO_PUBLIC_API_URL` in a local `.env` to make native development builds call that deployment.

To check the exported server locally:

```bash
npx expo export --platform web
npx expo serve
```

## Verify

```bash
npx expo lint
npx tsc --noEmit
```
