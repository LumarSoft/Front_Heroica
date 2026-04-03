# Refactoring Task — Split God Components

## Objective

Scan the entire project and split any file that exceeds 300 lines into smaller, focused components. The goal is clean, maintainable code — not over-engineering. Only split when it makes logical sense.

---

## Ground Rules

### When to split

- File exceeds 300 lines AND has clearly separable sections
- A section has its own state, logic, or UI responsibility
- A dialog is defined inline inside a page
- A loading/error/empty state is duplicated inline

### When NOT to split

- File is under 300 lines
- The logic is deeply coupled and splitting would require too many props
- Splitting would make the code harder to understand, not easier

### Rules for extracted components

- One component per file
- Place page-specific components in a subfolder: `components/[page-name]/`
  - Example: components extracted from `sucursales/[id]/page.tsx` → `components/sucursal-detail/`
- Place truly reusable components in `components/ui/` or `components/`
- All props must be explicitly typed with a TypeScript interface at the top of the file
- No `any` types
- No inline SVGs — use Lucide React icons
- No manual spinner divs — use `<LoadingSpinner />`
- No inline delete confirmations — use `<DeleteDialog />`

---

## Files to audit (prioritized by size)

Scan these files first — they are known to be oversized:

1. `app/sucursales/[id]/page.tsx` — ~1420 lines
2. `app/configuracion/page.tsx` — ~900 lines
3. `app/sucursales/[id]/pagos-pendientes/page.tsx` — ~580 lines
4. `components/caja/TransactionDialogs.tsx` — ~650 lines
5. `components/NuevoMovimientoDialog.tsx` — ~570 lines

Then scan ALL other files in the project for any that exceed 300 lines.

---

## Specific instructions per file

### `app/sucursales/[id]/page.tsx` (~1420 lines)

This file has at least these clearly separable sections:

- **Header** — back button, title, info button, reports button → extract to `components/sucursal-detail/SucursalHeader.tsx`
- **CajaCard** — the 3 clickable cards (efectivo, banco, pagos pendientes) each with their saldo display → extract to `components/sucursal-detail/CajaCard.tsx` (single reusable card component)
- **SucursalInfoDialog** — the large dialog with the edit form → extract to `components/sucursal-detail/SucursalInfoDialog.tsx`
- **DocumentacionSection** — the list of mandatory documents with upload/download/delete → extract to `components/sucursal-detail/DocumentacionSection.tsx`
- **CuentasBancariasSection** — the bank accounts list with add/delete → extract to `components/sucursal-detail/CuentasBancariasSection.tsx`
- **DeleteCuentaDialog / DeleteDocDialog** — replace both with `<DeleteDialog />` if it exists, otherwise use the shared confirmation dialog pattern

The page file itself should only contain:

- State orchestration
- Data fetching calls (using the existing `useCallback` hooks)
- Rendering of the extracted components with their props

### `app/configuracion/page.tsx` (~900 lines)

This file has 4 CRUD sections. Each section should be its own component:

- `components/configuracion/CategoriasSection.tsx`
- `components/configuracion/SubcategoriasSection.tsx`
- `components/configuracion/BancosSection.tsx`
- `components/configuracion/MediosPagoSection.tsx`

### `app/sucursales/[id]/pagos-pendientes/page.tsx` (~580 lines)

Identify and extract:

- The table/list of pending payments → `components/pagos-pendientes/PagosPendientesTable.tsx`
- Any inline dialogs → extract or replace with `<DeleteDialog />`

### `components/caja/TransactionDialogs.tsx` (~650 lines)

This file has multiple dialogs. Split into one file per dialog:

- Each dialog gets its own file inside `components/caja/`
- Name each file after the dialog it contains

### `components/NuevoMovimientoDialog.tsx` (~570 lines)

Split into:

- `NuevoMovimientoDialog.tsx` — the dialog shell (open/close, submit button)
- `MovimientoForm.tsx` — the form fields logic

---

## What to fix while splitting

While extracting each component, also fix these issues if you encounter them:

- Replace any inline SVG `<svg>` with the appropriate Lucide icon
- Replace any manual spinner `<div className="...animate-spin...">` with `<LoadingSpinner />`
- Replace any inline delete confirmation `<Dialog>` with `<DeleteDialog />`
- Remove any duplicate `<Input>` fields (there are duplicated CBU and tipo_cuenta inputs in the current sucursal detail page — remove the duplicates)
- Type all props explicitly — no `any`

---

## Process

For each file:

1. Read the entire file first
2. Identify logical sections that can be cleanly separated
3. Create the new component files with proper TypeScript interfaces
4. Update the original file to import and use the new components
5. Verify the original file is under 300 lines after splitting
6. Do not change any business logic or UI — only restructure

## Questions before starting

If you are unsure whether to split a section, ask me before doing it. Do not split just to hit the line count — only split when the separation is logical and clean.
