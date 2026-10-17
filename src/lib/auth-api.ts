import type { EligibilityResponse, VerificationStartResponse } from '@/lib/eligibility';
import { apiUrl } from '@/lib/api';
import type { ListingSearchResult, SearchFilters } from '@/lib/search';

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

export function interpretListingSearch(token: string, input: { prompt: string; selectedLocation?: { latitude: number; longitude: number } }) {
  return authenticatedRequest<{ filters: SearchFilters }>('/api/search/interpret', token, { method: 'POST', body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } });
}

export function searchListings(token: string, filters: SearchFilters) {
  return authenticatedRequest<{ filters: SearchFilters; listings: ListingSearchResult[] }>('/api/listings/search', token, { method: 'POST', body: JSON.stringify(filters), headers: { 'Content-Type': 'application/json' } });
}

export function askListingQuestion(token: string, listingId: string, message: string, threadId?: string) {
  return authenticatedRequest<{ threadId: string; message: { text: string; citations: { title: string; url: string }[] } }>(`/api/listings/${listingId}/chat`, token, { method: 'POST', body: JSON.stringify({ message, threadId }), headers: { 'Content-Type': 'application/json' } });
}

export async function transcribeAudio(token: string, file: Blob, name: string) {
  const form = new FormData();
  form.append('audio', file, name);
  return authenticatedRequest<{ text: string }>('/api/ai/transcribe', token, { method: 'POST', body: form });
}
