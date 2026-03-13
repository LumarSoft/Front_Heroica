# AGENTS.md — Front_Heroica (Global Rules)

## Project Stack
- **Framework:** Next.js (App Router) with TypeScript
- **State:** Zustand
- **UI Components:** Shadcn/ui
- **Styling:** Tailwind CSS
- **Notifications:** Sonner (`toast.success()` / `toast.error()`)
- **Images:** `next/image` (`<Image />`) — never `<img>`
- **Package manager:** pnpm

---

## 🔴 Package Manager — CRITICAL

This project uses **pnpm**. This is non-negotiable.

- **NEVER** use `npm install`, `npm i`, or `yarn add` for anything.
- **ALWAYS** use `pnpm add` to install packages.
- **ALWAYS** use `pnpm install` to restore dependencies.

```bash
# ✅ Correct
pnpm add zod
pnpm add -D @types/node
pnpm install

# ❌ Wrong — never use these
npm install zod
npm i zod
yarn add zod
```

Using `npm` or `yarn` will create a conflicting lockfile (`package-lock.json` / `yarn.lock`) and break the existing `pnpm-lock.yaml`. Before running any install command, verify it starts with `pnpm`.

---

## 🔴 SECURITY — Highest Priority

- **NEVER** log sensitive data: no `console.log(data)`, no `console.log(user)`, no `console.log(token)` anywhere.
- **NEVER** expose API keys, tokens, or secrets in client-side code. All secrets go in `.env.local` and are prefixed with `NEXT_PUBLIC_` only if they are truly public.
- **ALWAYS** include the `Authorization: Bearer ${token}` header in every fetch call that hits a protected endpoint. Get the token from `authStore`.
- **NEVER** use `window.confirm()`, `window.alert()`, or `window.prompt()`. Use the existing `DeleteDialog` component for confirmations.
- **NEVER** use `dangerouslySetInnerHTML` unless absolutely unavoidable and sanitized.
- Remove all `console.log`, `console.error`, and `console.warn` before considering any task complete. Use proper error boundaries or error state instead.
- **NEVER** build URLs by interpolating user input directly. Always sanitize or encode dynamic values before including them in a URL:
  ```ts
  // ❌ Wrong
  fetch(`/api/sucursales/${userInput}/movimientos`)
  
  // ✅ Correct
  const safeId = encodeURIComponent(userInput)
  fetch(`/api/sucursales/${safeId}/movimientos`)
  ```
- **NEVER** trust client-side validation alone. It is UI feedback only. The server must always validate independently. Zod schemas on the client do not replace server-side validation.
- **NEVER** store the auth token in `localStorage` without evaluating XSS risk. Prefer `httpOnly` cookies managed by the server. If `localStorage` is used, document explicitly why and what mitigations are in place.

---

## 🟠 TypeScript — Strict Typing

- **NEVER** use `any`. If the type is unknown, use `unknown` and narrow it with `instanceof Error`.
- All `catch` blocks must be: `catch (err: unknown) { if (err instanceof Error) ... }`
- **NEVER** use `type | string` unions that collapse the type (e.g., `"ingreso" | "egreso" | string` is forbidden — use `"ingreso" | "egreso"` only).
- Monetary fields (`monto`) must be `number` — never `number | string`. Parse at the API boundary, not throughout the app.
- Boolean flags must be typed as `boolean` — never as `number` (no `0 | 1` leaking from SQL schema into TypeScript domain).
- All API responses must have explicit types. Never type a response as `any`.
- Extend and use `lib/types.ts` — do not redeclare interfaces that already exist there.

---

## 🟡 Architecture — File & Component Rules

- **Maximum file length: 300 lines.** If a file exceeds this, it must be split.
- **One responsibility per file.** A page file should not contain dialog logic, fetch logic, and UI all together.
- Extract reusable UI patterns immediately:
  - Loading spinners → `<LoadingSpinner />`
  - Error banners → `<ErrorBanner />`
  - Access denied screens → `<AccessDenied />`
- **Never define sub-components inside a page file.** Move them to `/components`.
- **Never inline styles** with `<style>` tags or `dangerouslySetInnerHTML`. Global styles go in `globals.css`.
- Dialog components: one dialog per file. Never group multiple dialogs in a single file.
- Use `useRef` instead of `document.getElementById()` for DOM references.
- Derive repeated values once: e.g., `const sucursalId = Number(params.id)` — never repeat the same expression multiple times.

---

## 🟡 Performance

- Use `useMemo` for any computation over arrays or maps that runs on every render.
- Use `useCallback` for functions passed as props to child components.
- Never fetch the same data twice on initialization. Audit `useEffect` chains carefully.
- Apply debounce (min 400ms) to any input that triggers an API call (search fields, date filters).
- Catalogs (categories, banks, etc.) fetched in a parent hook must be passed as props — do not re-fetch them inside dialogs.
- Prefer React Server Components where there is no interactivity. Not everything needs `"use client"`.

---

## 🟢 Dependencies

- **Always install the latest stable version** of any package. Never install a deprecated or outdated version.
- Before installing a new dependency, check if the functionality already exists in the project or in an already-installed package.
- Preferred libraries (use these, do not introduce alternatives):
  - Validation → **Zod**
  - Data fetching / caching → **React Query (TanStack Query)**
  - Icons → **Lucide React** (already available via Shadcn)
  - Notifications → **Sonner**

---

## 🟢 General Conventions

- Language of the app UI: **Spanish**. All user-facing text must be in Spanish.
- `app/layout.tsx`: `lang="es"`, and the `<title>` must reflect the actual app name — never "Create Next App".
- Images: always `<Image />` from `next/image`. Never `<img>`.
- Notifications: always `toast.success()` / `toast.error()` from Sonner. Never `alert()`.
- Remove all dead imports before finishing any task. No unused variables, no unused imports.
- Do not suppress ESLint warnings with `eslint-disable`. Fix the underlying issue instead.
- Endpoints declared in `lib/config.ts` must be used. Remove any endpoint that is declared but never consumed.
- `useRef` objects for multiple inputs: `useRef<Record<string, HTMLInputElement | null>>({})` is the correct pattern.