export const API_BASE_URL = "https://api.nevolearning.com/api/v1";

/**
 * Centralised fetch wrapper for the Nevo backend API.
 * Automatically prefixes the base URL and sets JSON content-type.
 */
export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res;
}
