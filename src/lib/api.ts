export type HealthResponse = {
  message: string;
  status: 'ok';
  timestamp: string;
};

const configuredOrigin = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

/**
 * Uses the local Expo server in development by default. Set EXPO_PUBLIC_API_URL
 * to a deployed origin to make a native development build call that server.
 */
export function apiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error('API paths must begin with /.');
  }

  return configuredOrigin ? `${configuredOrigin}${path}` : path;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(apiUrl('/api/health'), {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}).`);
  }

  return (await response.json()) as HealthResponse;
}
