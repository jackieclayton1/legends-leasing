import { z } from 'zod';

export const searchFiltersSchema = z.object({
  query: z.string().trim().max(240).optional(),
  minMonthlyRentCents: z.number().int().nonnegative().optional(),
  maxMonthlyRentCents: z.number().int().positive().optional(),
  availableFrom: z.string().date().optional(),
  availableUntil: z.string().date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  maxDistanceMiles: z.number().positive().max(25).optional(),
  busRoute: z.string().trim().max(80).optional(),
  accessibilityTags: z.array(z.string().trim().max(80)).max(10).default([]),
  amenities: z.array(z.string().trim().max(80)).max(15).default([]),
  furnished: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  bedrooms: z.number().int().positive().max(12).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export const interpretSearchSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  selectedLocation: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
});

export type ListingSearchResult = {
  id: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  monthlyRentCents: number;
  bedrooms: number;
  bathrooms: number;
  availableFrom: string;
  availableUntil: string;
  furnished: boolean;
  petsAllowed: boolean;
  accessibilityTags: string[];
  amenities: string[];
  busRoutes: string[];
  distanceMiles?: number;
};
