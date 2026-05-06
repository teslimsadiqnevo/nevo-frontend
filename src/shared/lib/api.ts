const DEFAULT_API_BASE_URL = "https://api.nevolearning.com/api/v1";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  DEFAULT_API_BASE_URL;

/**
 * Centralised fetch wrapper for the Nevo backend API.
 * Automatically prefixes the base URL and only sets JSON content-type when needed.
 */
export async function apiFetch(path: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  const hasBody = options?.body !== undefined && options?.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: options?.cache ?? "no-store",
  });
  return res;
}
