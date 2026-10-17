import type { Apartment } from '@/data/types';
import type { ListingSearchResult } from '@/lib/search';

/** Adapts verified Drizzle listings to the rich map-card model without exposing owner data. */
export function listingToApartment(listing: ListingSearchResult): Apartment {
  const crimsonRide = listing.busRoutes.some((route) => /crimson|ride/i.test(route));
  return {
    id: listing.id,
    name: listing.title,
    neighborhood: 'Tuscaloosa',
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    rating: 0,
    reviews: 0,
    phone: '',
    yearBuilt: new Date().getFullYear(),
    leaseType: 'By the unit',
    availability: `${listing.availableFrom} – ${listing.availableUntil}`,
    pets: listing.petsAllowed,
    furnished: listing.furnished,
    shuttle: crimsonRide,
    busRoutes: listing.busRoutes,
    parking: listing.amenities.some((amenity) => /parking/i.test(amenity)) ? 'See listing amenities' : 'Not specified',
    palette: ['#9E1B32', '#F3B61F'],
    description: listing.description,
    amenities: [...listing.amenities, ...listing.accessibilityTags, ...listing.busRoutes],
    plans: [{ name: `${listing.bedrooms} bed`, beds: listing.bedrooms, baths: listing.bathrooms, sqft: 0, price: listing.monthlyRentCents / 100 }],
    priceMin: listing.monthlyRentCents / 100,
    priceMax: listing.monthlyRentCents / 100,
    beds: [listing.bedrooms],
  };
}
