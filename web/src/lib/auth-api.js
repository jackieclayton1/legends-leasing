import { authenticatedRequest } from '@/lib/api';

// GET /api/eligibility -> { tenant, status, category, expiresAt, canAccess }
export const getEligibility = (token) => authenticatedRequest('/api/eligibility', token);

// POST /api/verification/start -> { status: 'verified' | 'started' | 'unavailable', ... }
export const startVerification = (token) =>
  authenticatedRequest('/api/verification/start', token, { method: 'POST' });
