# AGENTS.md — /hooks

## Purpose

Custom React hooks that encapsulate stateful logic, data fetching, and side effects.

---

## Rules

### Hook Design

- One hook per file. The filename must match the hook name: `use-caja-data.ts` → `useCajaData`.
- Hooks must return typed objects — never return raw arrays of mixed types.
- All returned values and functions must be explicitly typed.

### Data Fetching

- Every fetch call to a protected endpoint MUST include the Authorization header:

  ```ts
  const { token } = useAuthStore()

  fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  ```

- Never fetch the same resource twice during initialization. Audit `useEffect` chains.
- Catalog data (categories, banks, etc.) fetched in a hook must be passed as props to child components — do not re-fetch inside dialogs.

### Performance

- Derived values computed from arrays or maps must be wrapped in `useMemo`.
- Callbacks passed to child components must be wrapped in `useCallback`.
- Polling intervals must be clearly documented with a comment explaining why polling is needed and at what frequency.

### Error Handling

- All `catch` blocks: `catch (err: unknown) { if (err instanceof Error) ... }`
- Never use `catch (err: any)`.
- Do not use `console.error` for error reporting in production. Set error state and surface it via `<ErrorBanner />`.

### No Console Logs

- Zero `console.log`, `console.error`, `console.warn` in hooks.
- If debugging is needed during development, remove all logs before committing.

### ESLint

- Never suppress `react-hooks/exhaustive-deps` with `eslint-disable`.
- Fix the dependency array properly instead.
