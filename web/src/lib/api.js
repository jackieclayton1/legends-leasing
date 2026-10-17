const configuredOrigin = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

/** Relative in dev (Vite proxies /api to Expo); absolute in production via VITE_API_URL. */
export function apiUrl(path) {
  if (!path.startsWith('/')) throw new Error('API paths must begin with /.');
  return configuredOrigin ? `${configuredOrigin}${path}` : path;
}

export async function authenticatedRequest(path, token, init = {}) {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? body.message ?? `API request failed (${response.status}).`);
  }
  return body;
}
