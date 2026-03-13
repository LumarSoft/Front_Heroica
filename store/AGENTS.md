# AGENTS.md — /store

## Purpose
Global state management using Zustand.

---

## Rules

### Store Design
- One store per domain. Do not put unrelated state in the same store.
- All state and actions must be explicitly typed. Never use `any` in store definitions.
- Stores must be defined with a TypeScript interface:
  ```ts
  interface AuthState {
    token: string | null
    user: User | null
    setToken: (token: string) => void
    logout: () => void
  }
  ```

### authStore — Critical Rules
- The token stored in `authStore` MUST be included in every fetch call to protected endpoints:
  ```ts
  const { token } = useAuthStore()
  // Then in fetch:
  headers: { "Authorization": `Bearer ${token}` }
  ```
- Never access `authStore` state directly outside of React components or hooks. Use the Zustand selector pattern.
- On logout, clear ALL sensitive state: token, user data, and any cached sensitive information.

### Security
- Never log store state: no `console.log(useAuthStore.getState())`.
- Never expose the token in URLs, query params, or any client-visible location other than the Authorization header.
- Never persist sensitive data to `localStorage` without encryption. If persistence is needed, evaluate the security implications first.

### Selectors
- Always use selectors to access store slices — do not subscribe to the entire store:
  ```ts
  // ✅ Correct
  const token = useAuthStore((state) => state.token)
  
  // ❌ Avoid — subscribes to all state changes
  const { token, user, logout } = useAuthStore()
  ```