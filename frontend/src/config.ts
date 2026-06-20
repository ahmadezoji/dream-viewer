// Central runtime configuration. The API base URL is injected at build time
// via Vite (VITE_API_BASE_URL), defaulting to the local backend.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
