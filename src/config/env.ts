// Vite replaces import.meta.env.* at build time.
// VITE_API_BASE_URL may be an empty string (not undefined) when unset,
// so we check truthiness explicitly rather than relying on ??.
const _envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const env = {
  apiBaseUrl: _envUrl || '',
} as const;
