# AGENTS.md — /app

## Purpose
Next.js App Router pages and layouts. Each folder represents a route segment.

---

## Rules

### Page Files — Size & Responsibility
- **Maximum 300 lines per page file.** If it grows beyond that, extract components.
- A page file is responsible for: layout, data orchestration, and rendering.
- A page file is NOT responsible for: dialog logic, inline form handling, business logic computations.
- Extract dialogs to `/components`. Extract data logic to `/hooks`.

### No God Components
The following patterns are forbidden in page files:
- Defining sub-components inside the page file (move them to `/components`). This includes utility components like `SectionHeading`, `SummaryCard`, `BreakdownPanel`, `DistributionRow`, `DeudaPanel` — each must be its own file.
- Multiple `useState` for dialogs (use a single dialog state manager or extract to component)
- Inline fetch logic (use a custom hook from `/hooks`)
- Multiple unrelated `useEffect` blocks (each should be in its own hook)
- IIFEs inside JSX — `{(() => { ... })()}` is always forbidden. Extract to a variable or component.

### layout.tsx
- `lang` attribute must be `"es"` (the app is in Spanish).
- `<title>` must be the real application name — never "Create Next App".

### Authentication
- Every page that requires authentication must use `useAuthGuard`.
- Never access protected routes without verifying the token first.
- Never render sensitive data before authentication is confirmed.

### app/page.tsx (Login)
- Must never log user data or tokens: no `console.log(data)` after login.
- Use `<Image />` from `next/image` for any images.
- Use `Eye` / `EyeOff` from Lucide React for password visibility toggles — no inline SVGs.

### /sucursales (list page)
- All SVG icons must be replaced with Lucide React equivalents (e.g., `Building2`, `MapPin`, `Trash2`, `Store`). No inline `<svg>` in JSX.
- Delete confirmation must use `<DeleteDialog />` — never a `<Dialog>` built inline inside the page.
- Loading states inside buttons must use `<LoadingSpinner />` — never a manual `border-t-white rounded-full animate-spin` div.

### /sucursales/[id]
- `Number(params.id)` must be assigned once: `const sucursalId = Number(params.id)`.
- Never repeat `Number(params.id)` inline throughout the file.
- File uploads must use `useRef` — never `document.getElementById("file-upload")`.
- If the file exceeds 300 lines, it must be split into sub-components.

### /configuracion
- All delete confirmations must use `<DeleteDialog />` — never `window.confirm()`.
- Each CRUD section must be its own component in `/components`.

### /reportes
- All sub-components must live in `/components`, not defined inline in the page file.
- Print styles must go in `globals.css` — never `<style dangerouslySetInnerHTML>`.
- API response types must be explicitly defined — never `reportData: any`.
- Date filter inputs must have debounce (minimum 400ms) before triggering API calls.

### /pagos-pendientes
- `getEstadoColor`, `getPrioridadColor`, `capitalize` must be imported from `lib/formatters.ts`.
- Never import these utilities and leave them unused.

### React Server Components
- Prefer RSC for pages and sections with no interactivity.
- Do not add `"use client"` to a file unless it genuinely requires browser APIs, event handlers, or React hooks.
- Fetching data in a `useEffect` inside a client component is the last resort — prefer RSC data fetching.

### No Console Logs
- Zero `console.log`, `console.error`, `console.warn` in any page file.
- Error states must be stored in state and rendered via `<ErrorBanner />`.