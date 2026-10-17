// The University of Alabama, Tuscaloosa. Coordinates are approximate.

import type { MaterialSymbolName, SFSymbolName } from '@/components/maps/icon';

import type { Landmark, LatLng } from './types';

export const CAMPUS_CENTER: LatLng = { latitude: 33.2104, longitude: -87.5425 };

// Opening camera: campus plus the surrounding off-campus neighborhoods.
export const INITIAL_BOUNDS = { north: 33.2245, south: 33.1905, west: -87.57, east: -87.518 };

// Rough outline of the main campus, used for the tan "university" shading
// Apple Maps draws under campuses. [lng, lat] pairs.
export const CAMPUS_OUTLINE: [number, number][] = [
  [-87.5522, 33.2158],
  [-87.5478, 33.2182],
  [-87.54, 33.219],
  [-87.5322, 33.2181],
  [-87.5282, 33.2148],
  [-87.5276, 33.206],
  [-87.53, 33.2022],
  [-87.536, 33.2012],
  [-87.544, 33.2016],
  [-87.55, 33.204],
  [-87.5522, 33.208],
  [-87.5522, 33.2158],
];

// Category drives the glyph + color of each marker, like Apple's POI palette.
export const LANDMARKS: Landmark[] = [
  {
    id: 'quad',
    name: 'The Quad',
    category: 'park',
    latitude: 33.211,
    longitude: -87.546,
    blurb: 'The heart of campus — tailgates, intramurals and sunny-day studying.',
  },
  {
    id: 'denny-chimes',
    name: 'Denny Chimes',
    category: 'landmark',
    latitude: 33.2095,
    longitude: -87.5459,
    blurb: '115-foot carillon tower on the south side of the Quad.',
  },
  {
    id: 'gorgas',
    name: 'Gorgas Library',
    category: 'library',
    latitude: 33.2124,
    longitude: -87.5462,
    blurb: 'Main campus library at the north end of the Quad.',
  },
  {
    id: 'ferguson',
    name: 'Ferguson Student Center',
    category: 'school',
    latitude: 33.2147,
    longitude: -87.5464,
    blurb: 'Student union: dining, bookstore, Starbucks and the SUPe Store.',
  },
  {
    id: 'shelby',
    name: 'Shelby Hall',
    category: 'school',
    latitude: 33.2143,
    longitude: -87.5425,
    blurb: 'Science & engineering quad.',
  },
  {
    id: 'bryant-denny',
    name: 'Bryant–Denny Stadium',
    category: 'stadium',
    latitude: 33.2083,
    longitude: -87.5503,
    blurb: 'Home of Crimson Tide football. Roll Tide.',
  },
  {
    id: 'coleman',
    name: 'Coleman Coliseum',
    category: 'stadium',
    latitude: 33.2031,
    longitude: -87.5389,
    blurb: 'Basketball and gymnastics arena.',
  },
  {
    id: 'rec-center',
    name: 'Student Recreation Center',
    category: 'fitness',
    latitude: 33.2063,
    longitude: -87.533,
    blurb: 'Gym, pools, courts and climbing wall.',
  },
  {
    id: 'the-strip',
    name: 'The Strip',
    category: 'food',
    latitude: 33.2104,
    longitude: -87.5545,
    blurb: 'Bars, late-night food and game-day crowds on University Blvd.',
  },
  {
    id: 'downtown',
    name: 'Downtown Tuscaloosa',
    category: 'city',
    latitude: 33.2087,
    longitude: -87.5672,
    blurb: 'Restaurants, shops and the riverfront along Greensboro Ave.',
  },
];

// Destinations offered in the commute / directions picker.
export const COMMUTE_DESTINATIONS = [
  'quad',
  'ferguson',
  'shelby',
  'bryant-denny',
  'rec-center',
  'the-strip',
  'downtown',
];

export const landmarkById: Record<string, Landmark> = Object.fromEntries(
  LANDMARKS.map((l) => [l.id, l])
);

// Apple-style POI colors and glyphs per category.
export const CATEGORY_STYLE: Record<
  Landmark['category'],
  { color: string; ios: SFSymbolName; md: MaterialSymbolName; label: string }
> = {
  park: { color: '#34A853', ios: 'leaf.fill', md: 'park', label: 'Park' },
  landmark: {
    color: '#8E8E93',
    ios: 'building.columns.fill',
    md: 'account_balance',
    label: 'Landmark',
  },
  library: { color: '#A2845E', ios: 'books.vertical.fill', md: 'local_library', label: 'Library' },
  school: {
    color: '#A2845E',
    ios: 'graduationcap.fill',
    md: 'school',
    label: 'University Building',
  },
  stadium: { color: '#30B0C7', ios: 'sportscourt.fill', md: 'stadium', label: 'Stadium' },
  fitness: { color: '#5856D6', ios: 'figure.run', md: 'fitness_center', label: 'Recreation' },
  food: { color: '#FF9500', ios: 'fork.knife', md: 'restaurant', label: 'Nightlife & Dining' },
  city: { color: '#007AFF', ios: 'building.2.fill', md: 'location_city', label: 'Neighborhood' },
};
