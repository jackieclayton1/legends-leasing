import type { EligibilityResponse, VerificationStartResponse } from '@/lib/eligibility';
import { apiUrl } from '@/lib/api';

async function authenticatedRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(body.error ?? `API request failed (${response.status}).`);
  }

  return body;
}

export function getEligibility(token: string) {
  return authenticatedRequest<EligibilityResponse>('/api/eligibility', token);
}

export function startVerification(token: string) {
  return authenticatedRequest<VerificationStartResponse>('/api/verification/start', token, {
    method: 'POST',
  });
}
