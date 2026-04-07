# AGENTS.md — /components

## Purpose

Shared, reusable UI components. Nothing here should be page-specific.

---

## Rules

### Component Design

- One component per file. No exceptions.
- Each component must have a single, clear responsibility.
- All props must be explicitly typed with a TypeScript interface — never use `any`.
- All prop interfaces must be defined at the top of the file, immediately after imports.
- Component names must match what they actually do. If a component's name is misleading, rename it before proceeding.
- Never define sub-components inside another component or page file. Every sub-component gets its own file.

### Required Shared Components

Before building anything inline, check if a shared component already exists for it:

| Need                              | Shared Component         |
| --------------------------------- | ------------------------ |
| Loading state                     | `<LoadingSpinner />`     |
| Full page loading                 | `<PageLoadingSpinner />` |
| Error message                     | `<ErrorBanner />`        |
| Empty state                       | `<EmptyState />`         |
| Delete / destructive confirmation | `<ConfirmDialog />`      |
| Access denied screen              | `<AccessDenied />`       |

- **Never build these inline** inside a page or component. Create the shared component once and reuse it.
- **Never use `window.confirm()`** for confirmations. Always use `<ConfirmDialog />`.
- **Never use inline loading spinners** (`animate-spin` divs). Always use `<LoadingSpinner />`, including inside buttons during loading states:

  ```tsx
  // ❌ Wrong
  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

  // ✅ Correct
  <LoadingSpinner className="w-5 h-5" />
  ```

- **Informational dialogs** (`ContactDialog`, `HelpDialog`, `AboutDialog`, etc.) must always live in `/components` as their own file — never defined inline inside a page.

### Styling

- Tailwind utility classes only.
- **`style={{}}` inline is only permitted when Tailwind cannot express the value** (e.g., dynamic gradients, arbitrary values outside the scale). When used, it must have a comment explaining why:

  ```tsx
  // ✅ Acceptable — Tailwind cannot express radial-gradient patterns
  style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)" }}

  // ❌ Wrong — Tailwind can handle this
  style={{ color: "#002868", fontWeight: "bold" }}
  ```

- Never use `<style>` tags or `dangerouslySetInnerHTML` for CSS. All styles go in `globals.css`.
- Always use Shadcn/ui primitives — never raw HTML form elements:
  - `<Input />` not `<input>`
  - `<Button />` not `<button>`
  - `<Label />` not `<label>`
  - `<Select />` not `<select>`
  - `<Textarea />` not `<textarea>`
- Shared class strings must live in `lib/styles.ts` — never defined locally inside a component.
- Avoid chaining many `!important` Tailwind overrides. Use component variants instead.

### Icons & Third-party SVGs

- Always use Lucide React for icons. Never inline SVG in JSX:

  ```tsx
  // ✅ Correct
  import { Trash2, ArrowLeft, Mail, Clock } from 'lucide-react';

  // ❌ Wrong
  <svg xmlns="..." viewBox="...">
    ...
  </svg>;
  ```

- **Third-party brand icons** (WhatsApp, Google, Instagram, etc.) are not in Lucide. For these:
  - Save the SVG in `/public/icons/` (e.g., `/public/icons/whatsapp.svg`)
  - Render with `<Image />` from `next/image`:

  ```tsx
  // ✅ Correct
  <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={20} height={20} />

  // ❌ Wrong — inline brand SVG path data
  <svg fill="currentColor" viewBox="0 0 24 24">...path data...</svg>
  ```

### Images

- Always use `<Image />` from `next/image`. Never `<img>`.

### Notifications

- Always use Sonner: `toast.success()` / `toast.error()`.
- Never use `alert()` or any browser-native notification.

### No Dead Code

- Remove all unused imports before finishing.
- Never leave commented-out code in committed files.

### No IIFEs in JSX

- Never use `{(() => { ... })()}` inside JSX.
- Extract the logic to a variable or a named component before the return statement.
