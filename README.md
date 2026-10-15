# FRC Battery Logger

React Router 7 + Convex battery logging app for FRC Team 341.

## Run locally

From this directory, use the one-command development entrypoint:

```powershell
bun run start
```

`start` installs the lockfile dependencies and starts only the local React Router/Vite UI server. It does not start or connect to Convex.

Convex is wired into the app and is the durable production data store. For local-only UI work, set `VITE_ENABLE_CONVEX=false`. For a connected environment, set `VITE_ENABLE_CONVEX=true` and run:

```powershell
bun run dev:convex
```

If you clone the project elsewhere, copy `.env.example` to `.env.local`, authenticate with Convex, and run `bun run dev:convex` to select or provision a development deployment. The production path uses Convex Password authentication and stores batteries, events, members, readings, and match history in Convex. Existing local browser data is imported once when a new Convex account connects to an empty team.

## Vercel deployment

1. Create/select a Convex project and run `bunx convex dev` once locally (or `bunx convex deploy` for production) so the schema and functions are deployed.
2. In Vercel, add `VITE_ENABLE_CONVEX=true`, `VITE_CONVEX_URL` (the Convex deployment URL), and `VITE_CONVEX_SITE_URL` (the Convex site URL) for the production environment.
3. Deploy the repository with the standard Vercel Vite settings. Do not use the local `.env.local` file as a production secret store.

## Baseline conventions

- React Router 7 in SPA mode owns routes and layouts.
- Convex Auth is mounted at the app root; persisted/domain data belongs in Convex.
- shadcn components use the Base UI primitives, CSS variables, and Lucide icons.
- Zustand is reserved for ephemeral client UI state.
- `next-themes` supplies class-based light/dark/system mode and Sonner is mounted globally.
