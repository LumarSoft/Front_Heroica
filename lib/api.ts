import { useAuthStore } from "@/store/authStore";

/**
 * Wrapper over the native fetch that automatically attaches the JWT Bearer
 * token from the Zustand auth store to every request.
 *
 * - For JSON bodies: sets Content-Type: application/json automatically.
 * - For FormData bodies: leaves Content-Type unset so the browser can inject
 *   the correct multipart/form-data boundary.
 * - Per-call headers always override the defaults.
 */
export function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = useAuthStore.getState().token;

  const defaultHeaders: Record<string, string> = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
