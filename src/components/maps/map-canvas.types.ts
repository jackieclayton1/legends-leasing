import type { Apartment, Landmark, LatLng, Route } from '@/data/types';

export type MapType = 'standard' | 'satellite';

export type MapCanvasProps = {
  apartments: Apartment[];
  landmarks: Landmark[];
  selectedId: string | null;
  route: Route | null;
  mapType: MapType;
  is3D: boolean;
  userLocation: LatLng | null;
  /** Space covered by UI at the bottom (sheet) or left (side panel), so the camera centers in what's visible. */
  insets: { top: number; bottom: number; left: number; right: number };
  onSelectApartment: (id: string) => void;
  onSelectLandmark: (id: string) => void;
  onPressMap: () => void;
  /** Web only: reports bearing so the custom compass can rotate. */
  onHeadingChange?: (heading: number) => void;
};

export type MapCanvasHandle = {
  flyTo: (target: LatLng, zoom?: number) => void;
  fitTo: (points: LatLng[]) => void;
  resetNorth: () => void;
  zoomBy: (delta: number) => void;
};
