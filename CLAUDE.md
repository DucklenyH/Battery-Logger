# Battery Logger — project rules

Mobile-first PWA that tracks competition battery health (Team 341). Read the product summary below before changing behavior.

## Run it
- `bun run dev` — starts Convex (`convex dev`) and the React Router dev server together.
- `bun run build`, `bun run lint`, `bun run typecheck` (typecheck needs `convex/_generated`, created by `convex dev`).
- Always use `bun`, `bunx`, `bun run`. Never npm, npx, yarn, or pnpm.
- Setup is done by the bootstrap script that created this project. Re-running it is safe.

## Stack
- Bun, Vite, React, TypeScript (strict — keep it strict).
- React Router 7, **framework mode, SPA** (`ssr: false`). Routes: `app/routes.ts`; route modules: `app/routes/`.
- Tailwind CSS v4, CSS variables for theming. Extra tokens and the Team 341 theme live in `app/themes.css`.
- shadcn/ui on **Base UI** (not Radix). Check generated source in `app/components/ui/` for exact APIs (Base UI uses a `render` prop where Radix used `asChild`). `app/components/option-select.tsx` is the one wrapper around shadcn Select.
- Lucide icons. next-themes (`attribute="class"`; themes: light, dark, team341, plus system). shadcn Sonner for toasts (`toast` from "sonner").
- Convex for all persisted data. Zustand only for ephemeral/local UI state.

## Data rules
- **Convex is the source of truth.** Use `useQuery` / `useMutation` in components. Never copy query results into Zustand.
- No API routes or extra backend layers.
- Zustand stores: `app/stores/ui-store.ts` (UI state) and `app/stores/session-store.ts` (signed-in name + entered codes, persisted on the device).
- The offline write queue is `app/lib/outbox.ts` (localStorage, not Zustand). `app/lib/use-outbox-sync.ts` flushes it. The server dedupes on `clientId`, so retries are safe.
- The Log page remembers the last batteries/carts/events lists in localStorage (`app/lib/use-persisted.ts`) so it still works after an offline reload. Don't use this for anything else; history and stats need a connection.

## Access model
- Sign-in is a first name plus a last initial, stored as "Alex R." (`formatName` / `validateName` in `convex/lib/validation.ts`). Names are stored as members; new names are Students. Two people with the same first name and initial would share a member.
- **Team Code** (Convex env `TEAM_CODE`) is required to log readings.
- **Admin Code** (Convex env `ADMIN_CODE`) + the member being a **Mentor** are both required for every admin mutation (`requireMentor` in `convex/lib/guards.ts`).
- If no Mentor exists, entering the Admin Code lets someone claim the role (`members.claimMentor`). At least one Mentor must always remain.
- Every create/edit/delete/config change writes an audit row with the signed-in name.

## Product rules (don't regress these)
- Logging order: pick a battery from the dropdown → confirmation card → "Coming off the charger" (Off charger) / "Going back on the charger" (Back on charger) → mismatch warning ("Log anyway" / "Cancel") → event (defaults to the active event) → Beak status → charge → V0 → V1 → V2 → IR → notes.
- Off charger = In use; Back on charger = Charging. A battery's status comes from its most recent non-deleted log.
- Valid ranges (`convex/lib/validation.ts`, enforced on client and server): charge 0–130%; V0/V1/V2 0–15 V with V2 ≤ V1 ≤ V0; IR > 0 and < 100 mΩ. IR is typed in by hand, never calculated.
- Match number, match type, and time since last charged are intentionally NOT collected.
- Voltage drop = V0 of the previous Off charger log − V0 of the next Back on charger log for the same battery. Post-use voltage = V0 of the Back on charger log.
- The IR retirement limit has **no default**. Until a mentor sets it, hide the limit line and flag nothing "needs replacing".
- Removing a battery with readings retires it (stays in stats). Only batteries with no readings are deleted.
- Deleted logs are soft-deleted and restorable.
- Colors: never put yellow text on white or cream. Yellow is a fill with black or dark-blue text.
- Out of scope for now: robot log integration (WPILib / AdvantageKit).

## UI rules
- Footer tabs: Logging, History, Statistics, Admin.
- Statistics page layout follows the FRC 180 reference: Fleet overview tiles, Alerts, Fleet comparison (tabs: Internal resistance / Post-use voltage / Times used, horizontal bars), Battery deep dive (selector + tabs IR health / Voltage / Drain), Health ranking. "Match usage" from the sketch is "Times used" because match numbers are intentionally not collected.
- Option cards (when / Beak status) use shadcn RadioGroup via `app/components/choice-group.tsx`.
- Use shadcn components wherever one exists. No hand-rolled raw form controls.
- Large tap targets; number fields use `inputMode="decimal"` / `"numeric"`.
- Path aliases: `@/` → `app/`, `@convex/` → `convex/`.

## Working agreement
- Ask before major changes (new dependencies, structural changes, schema changes) and ask for clarification instead of guessing.
- Project skills go in `.claude/skills/`.
