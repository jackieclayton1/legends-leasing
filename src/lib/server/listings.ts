import { and, eq, gte, ilike, lte, sql } from 'drizzle-orm';

import type { ListingSearchResult, SearchFilters } from '@/lib/search';
import { db } from '@/lib/server/db';
import { chatMessages, chatThreads, listings } from '@/lib/server/schema';

const milesPerLatitudeDegree = 69;

function listingResult(row: typeof listings.$inferSelect, distanceMiles?: number): ListingSearchResult {
  return {
    id: row.id, title: row.title, description: row.description, address: row.address, latitude: row.latitude, longitude: row.longitude,
    monthlyRentCents: row.monthlyRentCents, bedrooms: row.bedrooms, bathrooms: row.bathrooms,
    availableFrom: row.availableFrom, availableUntil: row.availableUntil, furnished: row.furnished,
    petsAllowed: row.petsAllowed, accessibilityTags: row.accessibilityTags, amenities: row.amenities,
    busRoutes: row.busRoutes, ...(distanceMiles === undefined ? {} : { distanceMiles }),
  };
}

export async function searchPublishedListings(tenantId: string, filters: SearchFilters) {
  const conditions = [eq(listings.tenantId, tenantId), eq(listings.status, 'published')];
  if (filters.minMonthlyRentCents) conditions.push(gte(listings.monthlyRentCents, filters.minMonthlyRentCents));
  if (filters.maxMonthlyRentCents) conditions.push(lte(listings.monthlyRentCents, filters.maxMonthlyRentCents));
  if (filters.bedrooms) conditions.push(eq(listings.bedrooms, filters.bedrooms));
  if (filters.availableFrom) conditions.push(lte(listings.availableFrom, filters.availableFrom));
  if (filters.availableUntil) conditions.push(gte(listings.availableUntil, filters.availableUntil));
  if (filters.furnished !== undefined) conditions.push(eq(listings.furnished, filters.furnished));
  if (filters.petsAllowed !== undefined) conditions.push(eq(listings.petsAllowed, filters.petsAllowed));
  if (filters.busRoute) conditions.push(sql`${filters.busRoute} = ANY(${listings.busRoutes})`);
  for (const tag of filters.accessibilityTags) conditions.push(sql`${tag} = ANY(${listings.accessibilityTags})`);
  for (const amenity of filters.amenities) conditions.push(sql`${amenity} = ANY(${listings.amenities})`);
  if (filters.query) conditions.push(sql`(${ilike(listings.title, `%${filters.query}%`)} OR ${ilike(listings.description, `%${filters.query}%`)})`);

  const rows = await db().select().from(listings).where(and(...conditions)).limit(50);
  return rows.map((row) => {
    if (filters.latitude === undefined || filters.longitude === undefined) return listingResult(row);
    const latitudeDelta = (row.latitude - filters.latitude) * milesPerLatitudeDegree;
    const longitudeDelta = (row.longitude - filters.longitude) * milesPerLatitudeDegree * Math.cos(filters.latitude * Math.PI / 180);
    const distanceMiles = Math.sqrt(latitudeDelta ** 2 + longitudeDelta ** 2);
    return listingResult(row, Number(distanceMiles.toFixed(1)));
  }).filter((row) => filters.maxDistanceMiles === undefined || (row.distanceMiles ?? Infinity) <= filters.maxDistanceMiles)
    .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0) || a.monthlyRentCents - b.monthlyRentCents);
}

export async function getListingForTenant(tenantId: string, listingId: string) {
  const rows = await db().select().from(listings).where(and(eq(listings.id, listingId), eq(listings.tenantId, tenantId), eq(listings.status, 'published'))).limit(1);
  return rows[0] ?? null;
}

export async function getOrCreateThread(listingId: string, clerkUserId: string, threadId?: string) {
  if (threadId) {
    const rows = await db().select().from(chatThreads).where(and(eq(chatThreads.id, threadId), eq(chatThreads.listingId, listingId), eq(chatThreads.clerkUserId, clerkUserId))).limit(1);
    if (rows[0]) return rows[0];
  }
  const rows = await db().insert(chatThreads).values({ listingId, clerkUserId, createdAt: new Date(), updatedAt: new Date() }).returning();
  return rows[0];
}

export async function getThreadHistory(threadId: string) {
  return db().select({ role: chatMessages.role, content: chatMessages.content }).from(chatMessages).where(eq(chatMessages.threadId, threadId)).limit(12);
}

export async function appendThreadMessage(input: { threadId: string; role: 'user' | 'assistant'; content: string; citations?: unknown[] }) {
  await db().insert(chatMessages).values({ threadId: input.threadId, role: input.role, content: input.content, citations: input.citations ?? [], createdAt: new Date() });
  await db().update(chatThreads).set({ updatedAt: new Date() }).where(eq(chatThreads.id, input.threadId));
}

export function approvedListingContext(listing: typeof listings.$inferSelect) {
  return JSON.stringify({
    title: listing.title, description: listing.description, address: listing.address,
    rent: `$${(listing.monthlyRentCents / 100).toFixed(0)} per month`, bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms, availability: `${listing.availableFrom} through ${listing.availableUntil}`,
    furnished: listing.furnished, petsAllowed: listing.petsAllowed, accessibilityTags: listing.accessibilityTags,
    amenities: listing.amenities, busRoutes: listing.busRoutes,
  }, null, 2);
}
