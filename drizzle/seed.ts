import { db } from '@/lib/server/db';
import { listings, tenants } from '@/lib/server/schema';
import { eq, inArray } from 'drizzle-orm';

async function seed() {
  const database = db();
  const tenant = await database.select().from(tenants).where(eq(tenants.slug, 'ua')).limit(1);
  if (!tenant[0]) throw new Error('Run the tenant migration before seeding listings.');
  await database.delete(listings).where(inArray(listings.ownerClerkUserId, ['seed-owner-1', 'seed-owner-2']));
  await database.insert(listings).values([
    { id: '00000000-0000-4000-8000-000000000001', tenantId: tenant[0].id, ownerClerkUserId: 'seed-owner-1', title: 'Walkable 2BR near campus', description: 'Two-bedroom sublease with a quiet study nook and in-unit laundry.', address: '1130 University Blvd, Tuscaloosa, AL', latitude: 33.2099, longitude: -87.5686, monthlyRentCents: 87500, bedrooms: 2, bathrooms: 2, availableFrom: '2026-01-01', availableUntil: '2026-07-31', furnished: true, petsAllowed: false, accessibilityTags: ['step-free-entry', 'elevator'], amenities: ['in-unit-laundry', 'study-room', 'parking'], busRoutes: ['Crimson Ride Red'], status: 'published', createdAt: new Date(), updatedAt: new Date() },
    { id: '00000000-0000-4000-8000-000000000002', tenantId: tenant[0].id, ownerClerkUserId: 'seed-owner-2', title: 'Furnished studio by DCH', description: 'A furnished studio with a simple commute to central campus.', address: '1900 7th St, Tuscaloosa, AL', latitude: 33.2074, longitude: -87.5627, monthlyRentCents: 72000, bedrooms: 1, bathrooms: 1, availableFrom: '2026-05-15', availableUntil: '2026-12-31', furnished: true, petsAllowed: true, accessibilityTags: [], amenities: ['parking', 'gym'], busRoutes: ['Crimson Ride Gold'], status: 'published', createdAt: new Date(), updatedAt: new Date() },
  ]).onConflictDoNothing();
}

void seed();
