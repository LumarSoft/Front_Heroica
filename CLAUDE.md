# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check only)
```

**Package manager: pnpm only.** Never use `npm` or `yarn` — they create a conflicting lockfile and break `pnpm-lock.yaml`.

## Architecture

### App structure

Next.js 16 App Router. All authenticated routes live under `app/(app)/` and are protected by `useAuthGuard` (hook) at the layout level. The root `app/page.tsx` is the login screen.

Two top-level modules gate access independently of RBAC:

- **Tesorería** → `/sucursales` (cash flow, pending payments, reports)
- **Recursos Humanos** → `/recursos-humanos` (staff, payroll, requests, calendar)

`ModuleGuard` wraps each module subtree and redirects unauthorized users. The API enforces the same check server-side via `requireModule()`.

### Auth

`store/authStore.ts` — Zustand store persisted to `localStorage`. Holds `token`, `user`, and all `can*()` permission methods. Superadmin (role id 3) bypasses every permission check.

`hooks/use-auth-guard.ts` — handles hydration delay (Zustand + SSR) and redirects unauthenticated users to `/`.

`lib/api.ts` — `apiFetch()` wrapper that automatically injects `Authorization: Bearer <token>` and sets `Content-Type: application/json` (skipped for `FormData`). **Always use `apiFetch` for protected endpoints, never raw `fetch`.**

### API endpoints

All endpoints are declared in `lib/config.ts` as `API_ENDPOINTS`. The base URL comes from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`). Never hardcode API URLs outside this file. Never leave a declared endpoint unused.

### Key lib files

| File                   | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `lib/types.ts`         | Single source of truth for all shared interfaces                     |
| `lib/config.ts`        | All API endpoint definitions                                         |
| `lib/constants.ts`     | `ROLES`, `MODULOS`, `PERMISOS` constants                             |
| `lib/formatters.ts`    | `getEstadoColor`, `getPrioridadColor`, `capitalize`, color maps      |
| `lib/dialog-styles.ts` | Shared Tailwind class strings (`inputClasses`, `labelClasses`, etc.) |
| `lib/schemas.ts`       | Zod validation schemas                                               |
| `lib/api.ts`           | `apiFetch` fetch wrapper                                             |

### State

- Auth: `store/authStore.ts`
- Calculator: `store/calculatorStore.ts`
- No server-state cache library (no React Query); data is fetched in custom hooks under `/hooks`.

### Component conventions

- Max **300 lines per file** — split if exceeded.
- One responsibility per file. Dialogs, forms, and tables each get their own file.
- Use shared components before building inline: `<LoadingSpinner />`, `<PageLoadingSpinner />`, `<ErrorBanner />`, `<AccessDenied />`, `<DeleteDialog />` (for confirmations — never `window.confirm()`).
- Shadcn/ui primitives always over raw HTML: `<Input />`, `<Button />`, `<Select />`, `<Label />`, `<Textarea />`.
- Icons: Lucide React only. Brand icons → save SVG in `/public/icons/`, render with `next/image`.
- Inline `style={{}}` only when Tailwind cannot express the value; must include a comment.
- No IIFEs in JSX (`{(() => {...})()}`). Extract to a variable or named component.

### Routing map

```
app/page.tsx                          → Login
app/(app)/home/page.tsx               → Dashboard
app/(app)/sucursales/                 → Branch list
app/(app)/sucursales/[id]/            → Branch detail (caja-efectivo, caja-banco, pagos-pendientes, reportes)
app/(app)/recursos-humanos/           → HR hub
app/(app)/recursos-humanos/[id]/      → Branch HR (legajos, escalas, incentivos, solicitudes, sueldos)
app/(app)/recursos-humanos/calendario → HR calendar
app/(app)/recursos-humanos/analitico  → HR analytics
app/(app)/configuracion/              → Settings (users, roles, categories, banks, etc.)
app/(app)/tareas/                     → Task board
```

### TypeScript rules

- Never use `any`. Unknown values: `catch (err: unknown) { if (err instanceof Error) ... }`.
- `monto` fields are always `number` — never `number | string`.
- Boolean flags are always `boolean` — never `0 | 1`.
- Never widen union types with `| string`.
- All API response shapes must have explicit types; add them to `lib/types.ts`.

### Other conventions

- App language is **Spanish** — all user-facing text in Spanish.
- Notifications: `toast.success()` / `toast.error()` from Sonner. Never `alert()`.
- Zero `console.log/error/warn` in committed code.
- Catalog data (categories, banks, etc.) fetched in a parent hook must be passed as props — never re-fetched inside dialogs.
- `useMemo` for array/map derivations; `useCallback` for callbacks passed to children.
- Debounce (≥ 400ms) on any input that triggers an API call.
- Prefer React Server Components where there is no interactivity; avoid `"use client"` unless the component genuinely needs browser APIs or hooks.
