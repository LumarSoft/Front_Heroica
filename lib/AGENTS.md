# AGENTS.md — /lib

## Purpose

Shared utilities, types, constants, API configuration, and style tokens.

---

## Rules

### lib/types.ts — Single Source of Truth

- ALL shared interfaces and types must be defined here.
- Never redeclare an interface in a page or component that already exists in `lib/types.ts`.
- When a type is needed in multiple places, extend it here — do not copy-paste it.
- **Any interface used by more than one file must immediately be moved to `lib/types.ts`.** Interfaces that are only used in a single, small component may live in that file — but the moment a second file needs it, it moves to `lib/types.ts`.
- **API response shape interfaces** (`ReportData`, `ReportResumen`, `ReportMovimiento`, etc.) always belong in `lib/types.ts` regardless of how many files use them.
- Strict type rules:
  - `monto` → always `number`. Never `number | string`.
  - Boolean flags → always `boolean`. Never `0 | 1`.
  - Union types → never collapse with `| string`. Use explicit unions only.
  - API response types → always explicit. Never `any`.

### lib/config.ts — API Endpoints

- Every endpoint declared here must be actively used somewhere in the app.
- Remove any endpoint that is declared but never consumed.
- Never hardcode API URLs outside of this file.

### lib/formatters.ts — Color Maps & Formatters

- `ESTADO_COLORS`, `PRIORIDAD_COLORS`, and similar maps must be defined here only.
- Local copies of these maps inside page or component files are forbidden. Import from here.
- `capitalize`, `getEstadoColor`, `getPrioridadColor` and similar utilities must be imported from this file — never redeclared locally.

### lib/dialog-styles.ts — Shared Class Strings

- `inputClasses`, `labelClasses`, `selectClasses`, and similar Tailwind class strings must live here.
- **Component-level style constants** like `TRIGGER_CLASS`, `PILL_CLASS`, `CARD_ACCENT_MAP`, and similar must also live here — never defined locally inside a component file.
- Color accent maps (e.g., `accentMap` mapping strings to Tailwind border/text/bg combos) belong here, not defined inline inside components.
- Never duplicate these strings across dialog or form components.

### Validation

- Use **Zod** for all form and API response validation.
- Define schemas in `lib/schemas.ts` (create if it doesn't exist).
- Never validate manually with `if (!value || value === "")` patterns when a Zod schema can handle it.

### No Secrets

- Never import or reference `.env` values that should be server-side only.
- Only `NEXT_PUBLIC_` prefixed variables may be used in client-side lib files.
