import { landmarkById } from '@/data/campus';
import type { Apartment, Landmark } from '@/data/types';

import { estimateTrip } from './geo';

export type SortKey = 'distance' | 'price' | 'rating';

export type Filters = {
  /** null = any; 4 means 4 or more. */
  beds: number | null;
  maxPrice: number | null;
  pets: boolean;
  furnished: boolean;
  shuttle: boolean;
  walkable: boolean;
  savedOnly: boolean;
};

export const NO_FILTERS: Filters = {
  beds: null,
  maxPrice: null,
  pets: false,
  furnished: false,
  shuttle: false,
  walkable: false,
  savedOnly: false,
};

export const WALKABLE_MINUTES = 15;

/** Walking minutes from an apartment to the Quad (the de facto campus center). */
export function walkToQuad(apt: Apartment) {
  return estimateTrip(apt, landmarkById.quad, 'walk').seconds / 60;
}

function matches(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

export function filterApartments(
  apartments: Apartment[],
  query: string,
  filters: Filters,
  sort: SortKey,
  saved: string[]
) {
  const q = query.trim().toLowerCase();
  const list = apartments.filter((a) => {
    if (
      q &&
      !matches(a.name, q) &&
      !matches(a.neighborhood, q) &&
      !matches(a.address, q) &&
      !a.amenities.some((x) => matches(x, q))
    ) {
      return false;
    }
    if (filters.beds != null) {
      const ok = filters.beds >= 4 ? a.beds.some((b) => b >= 4) : a.beds.includes(filters.beds);
      if (!ok) return false;
    }
    if (filters.maxPrice != null && a.priceMin > filters.maxPrice) return false;
    if (filters.pets && !a.pets) return false;
    if (filters.furnished && !a.furnished) return false;
    if (filters.shuttle && !a.shuttle) return false;
    if (filters.walkable && walkToQuad(a) > WALKABLE_MINUTES) return false;
    if (filters.savedOnly && !saved.includes(a.id)) return false;
    return true;
  });

  const key: Record<SortKey, (a: Apartment) => number> = {
    distance: walkToQuad,
    price: (a) => a.priceMin,
    rating: (a) => -a.rating,
  };
  return list.sort((a, b) => key[sort](a) - key[sort](b));
}

export function filterLandmarks(landmarks: Landmark[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return landmarks.filter((l) => matches(l.name, q) || matches(l.blurb, q));
}

export function activeFilterCount(f: Filters) {
  return (
    (f.beds != null ? 1 : 0) +
    (f.maxPrice != null ? 1 : 0) +
    [f.pets, f.furnished, f.shuttle, f.walkable, f.savedOnly].filter(Boolean).length
  );
}
