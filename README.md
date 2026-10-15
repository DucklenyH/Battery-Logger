# FRC Battery Logger

Framework-only React Router 7 SPA baseline for the FRC battery logging app.

## Run locally

From this directory, use the one-command development entrypoint:

```powershell
bun run start
```

`start` installs the lockfile dependencies and starts only the local React Router/Vite UI server. It does not start or connect to Convex.

Convex is wired into the app but disabled for offline UI work by default. When you are ready to use it, set `VITE_ENABLE_CONVEX=true` in `.env.local` and run:

```powershell
bun run dev:convex
```

The checked-in `.env.local` is connected to the personal Convex deployment for this project. If you clone the project elsewhere, copy `.env.example` to `.env.local`, authenticate with Convex, and run `bun run dev` to provision a development deployment.

## Baseline conventions

- React Router 7 in SPA mode owns routes and layouts.
- Convex Auth is mounted at the app root; persisted/domain data belongs in Convex.
- shadcn components use the Base UI primitives, CSS variables, and Lucide icons.
- Zustand is reserved for ephemeral client UI state.
- `next-themes` supplies class-based light/dark/system mode and Sonner is mounted globally.
