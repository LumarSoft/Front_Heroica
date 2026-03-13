# AGENTS.md — /components

## Purpose
This folder contains all shared, reusable UI components. Nothing here should be page-specific.

---

## Rules

### Component Design
- One component per file. No exceptions.
- Each component must have a single, clear responsibility.
- All props must be explicitly typed with a TypeScript interface — never use `any` for props.
- All props must have clear names. Avoid generic names like `data`, `item`, `info`.
- **Component names must match what the component actually does.** A component named `DateRangeFilter` must handle a date range (from + to). If it only handles one date field, name it `DateUntilFilter` or `DateFilter`. Misleading names are forbidden.
- **Never define sub-components inside a page or another component file.** Every sub-component (e.g., `SummaryCard`, `BreakdownPanel`, `DistributionRow`) must live in its own file inside `/components`.
- All component prop interfaces must be defined at the top of the file, immediately after imports. Never inline them mid-file.

### Required Shared Components
The following components MUST exist and MUST be used across the app instead of inline duplications:

| Component | Replaces |
|---|---|
| `<LoadingSpinner />` | Any `animate-spin` inline spinner, including manual `border-t-white rounded-full` spinners inside buttons |
| `<ErrorBanner />` | Any inline `AlertTriangle` error block |
| `<AccessDenied />` | Any inline "Acceso Denegado" screen |
| `<DeleteDialog />` | Any `window.confirm()` for deletions AND any inline delete confirmation dialog built inside a page |

If you need a confirmation dialog, use `<DeleteDialog />`. Never build a delete dialog inline inside a page file.

### No IIFEs in JSX
- Never use immediately invoked function expressions (IIFEs) inside JSX — e.g., `{(() => { ... })()}`.
- Extract that logic to a variable or a named function before the return statement, or move it to a dedicated component.

### Styling
- Use Tailwind utility classes only. No inline `style={{}}` objects unless for dynamic values impossible to achieve with Tailwind.
- **Never use `<style>` tags or `dangerouslySetInnerHTML` for CSS.** All styles go in `globals.css`. This applies to print styles, media queries, and any other CSS that can't be expressed with Tailwind classes.
- Use Shadcn/ui as the base component library. Do not reinvent buttons, inputs, modals, or selects.
- **Always use Shadcn's `<Input />` component** — never a raw `<input>` HTML element. Same for `<Button />`, `<Label />`, `<Select />`, etc.
- Shared class strings (e.g., `inputClasses`, `labelClasses`, `selectClasses`, `TRIGGER_CLASS`) must live in `lib/dialog-styles.ts`, not duplicated or defined locally inside components.
- Avoid chaining `!important` overrides (`!px-5 !py-2` etc.) across many Tailwind classes. If you need to override Shadcn defaults heavily, create a variant in the component config instead.

### Images
- Always use `<Image />` from `next/image`. Never `<img>`.

### Icons
- Use Lucide React for all icons. SVG icons must not be inlined in JSX.
  ```tsx
  // ✅ Correct
  import { Eye, EyeOff } from "lucide-react"
  
  // ❌ Wrong
  <svg xmlns="..." viewBox="...">...</svg>
  ```

### Notifications
- Use Sonner for all user feedback:
  ```tsx
  toast.success("Operación exitosa")
  toast.error("Ocurrió un error")
  ```
- Never use `alert()`, `window.alert()`, or `window.confirm()`.

### No Dead Code
- Remove all unused imports before finishing.
- Never leave commented-out code in committed files.