export type LatLng = { latitude: number; longitude: number };

export type FloorPlan = {
  name: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
};

export type Apartment = LatLng & {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  rating: number;
  reviews: number;
  phone: string;
  yearBuilt: number;
  leaseType: 'By the bed' | 'By the unit';
  availability: string;
  pets: boolean;
  furnished: boolean;
  shuttle: boolean;
  parking: string;
  /** Two colors for the photo placeholder gradient. */
  palette: [string, string];
  description: string;
  amenities: string[];
  plans: FloorPlan[];
  priceMin: number;
  priceMax: number;
  beds: number[];
};

export type LandmarkCategory =
  | 'park'
  | 'landmark'
  | 'library'
  | 'school'
  | 'stadium'
  | 'fitness'
  | 'food'
  | 'city';

export type Landmark = LatLng & {
  id: string;
  name: string;
  category: LandmarkCategory;
  blurb: string;
};

export type TravelMode = 'walk' | 'bike' | 'drive';

export type Route = {
  from: LatLng;
  to: LatLng;
  mode: TravelMode;
  coordinates: [number, number][];
  meters: number;
  seconds: number;
  /** True when the routing service was unreachable and this is a straight-line estimate. */
  approximate: boolean;
};
