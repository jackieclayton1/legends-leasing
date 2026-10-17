import type { LatLng, Route, TravelMode } from '@/data/types';

import { estimateTrip, MODES } from './geo';

const cache = new Map<string, Route>();

/**
 * Street routing from the public OSRM servers run by FOSSGIS
 * (routing.openstreetmap.de). If the service can't be reached we fall back
 * to a straight-line estimate so directions always show something.
 */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
  signal?: AbortSignal
): Promise<Route> {
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const key = `${mode}:${coords}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://routing.openstreetmap.de/${MODES[mode].profile}/route/v1/driving/${coords}` +
        '?overview=full&geometries=geojson',
      { signal }
    );
    if (!res.ok) throw new Error(`Routing failed: HTTP ${res.status}`);
    const data = await res.json();
    const best = data.routes?.[0];
    if (!best) throw new Error('No route found');
    const route: Route = {
      from,
      to,
      mode,
      coordinates: best.geometry.coordinates,
      meters: best.distance,
      seconds: best.duration,
      approximate: false,
    };
    cache.set(key, route);
    return route;
  } catch (error) {
    if (signal?.aborted) throw error;
    const { meters, seconds } = estimateTrip(from, to, mode);
    return {
      from,
      to,
      mode,
      coordinates: [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ],
      meters,
      seconds,
      approximate: true,
    };
  }
}
