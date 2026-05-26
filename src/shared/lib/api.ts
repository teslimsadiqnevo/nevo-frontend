const DEFAULT_API_BASE_URL = "https://api.nevolearning.com/api/v1";

function resolveApiBaseUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const serverUrl = process.env.API_BASE_URL;

  if (typeof window === "undefined") {
    return serverUrl || publicUrl || DEFAULT_API_BASE_URL;
  }

  return publicUrl || DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

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
