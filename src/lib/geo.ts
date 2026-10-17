import type { LatLng, TravelMode } from '@/data/types';

const EARTH_RADIUS_M = 6371000;

export function distanceMeters(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Average speeds (m/s) used for estimates, plus the OSRM profile for real routes.
export const MODES: Record<TravelMode, { label: string; speed: number; profile: string }> = {
  walk: { label: 'Walk', speed: 1.35, profile: 'routed-foot' },
  bike: { label: 'Bike', speed: 4.2, profile: 'routed-bike' },
  drive: { label: 'Drive', speed: 8.0, profile: 'routed-car' },
};

// Streets are rarely straight lines; inflate crow-flies distance for estimates.
const DETOUR_FACTOR = 1.3;

export function estimateTrip(a: LatLng, b: LatLng, mode: TravelMode) {
  const meters = distanceMeters(a, b) * DETOUR_FACTOR;
  const overhead = mode === 'drive' ? 120 : 0; // parking + lights
  return { meters, seconds: meters / MODES[mode].speed + overhead };
}

export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

export function formatDistance(meters: number) {
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

export function formatPrice(value: number) {
  return `$${value.toLocaleString('en-US')}`;
}
