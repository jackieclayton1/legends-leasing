import 'maplibre-gl/dist/maplibre-gl.css';

import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { createPortal } from 'react-dom';

import { CAMPUS_CENTER, INITIAL_BOUNDS } from '@/data/campus';
import type { Route } from '@/data/types';
import { ROUTE_CASING, ROUTE_COLOR, useMapsTheme } from '@/constants/maps-theme';

import { appleStyle, firstLayerId } from './apple-style';
import type { MapCanvasHandle, MapCanvasProps, MapType } from './map-canvas.types';
import { ApartmentPin, CampusLabel, LandmarkPin, PIN_ANCHOR, PIN_BOX, UserDot } from './pins';

// Free, keyless OpenStreetMap vector basemap from OpenFreeMap. "liberty"
// carries 3D building extrusions; appleStyle() repaints it in Apple's palette.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Tilted, slightly rotated camera — the default "3D" look. */
const PITCH_3D = 55;
const BEARING_3D = -17;

const esri = (path: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${path}/MapServer/tile/{z}/{y}/{x}`;

// Hybrid satellite: Esri imagery with road and place-name overlays.
const STYLE_SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: 'raster',
      tiles: [esri('World_Imagery')],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
    roads: { type: 'raster', tiles: [esri('Reference/World_Transportation')], tileSize: 256 },
    places: {
      type: 'raster',
      tiles: [esri('Reference/World_Boundaries_and_Places')],
      tileSize: 256,
    },
  },
  layers: [
    { id: 'imagery', type: 'raster', source: 'imagery' },
    { id: 'roads', type: 'raster', source: 'roads', paint: { 'raster-opacity': 0.7 } },
    { id: 'places', type: 'raster', source: 'places' },
  ],
};

function applyStyle(map: MapLibreMap, mapType: MapType, dark: boolean) {
  if (mapType === 'satellite') {
    map.setStyle(STYLE_SATELLITE);
  } else {
    map.setStyle(STYLE_URL, { transformStyle: (_previous, next) => appleStyle(next, dark) });
  }
}

const emptyLine: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: [] },
};

function routeFeature(route: Route | null): GeoJSON.Feature<GeoJSON.LineString> {
  if (!route) return emptyLine;
  return { ...emptyLine, geometry: { type: 'LineString', coordinates: route.coordinates } };
}

/** The route overlay; re-added whenever the basemap style is swapped. */
function addOverlays(map: MapLibreMap, route: Route | null) {
  if (!map.getSource('route')) {
    // Draw under street names and buildings, like Apple does.
    const beforeId = firstLayerId(
      map.getStyle(),
      (l) => l.type === 'symbol' || l.type === 'fill-extrusion'
    );
    map.addSource('route', { type: 'geojson', data: routeFeature(route) });
    map.addLayer(
      {
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE_CASING, 'line-width': 9 },
      },
      beforeId
    );
    map.addLayer(
      {
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE_COLOR, 'line-width': 6 },
      },
      beforeId
    );
  }
}

function setRouteStyle(map: MapLibreMap, route: Route | null) {
  if (!map.getLayer('route-line')) return;
  const walking = route?.mode === 'walk';
  // Apple draws walking directions as a dotted line.
  map.setPaintProperty('route-casing', 'line-opacity', walking ? 0 : 1);
  map.setPaintProperty('route-line', 'line-width', walking ? 7 : 6);
  map.setPaintProperty('route-line', 'line-dasharray', walking ? [0, 1.8] : [1, 0]);
}

type PortalMarker = { el: HTMLDivElement; marker: Marker };

type PinSpec = {
  id: string;
  lngLat: [number, number];
  interactive: boolean;
  zIndex: number;
  node: React.ReactNode;
};

/**
 * Web map built on MapLibre GL. Pins are React components rendered into
 * MapLibre marker elements through portals, so they match native exactly.
 */
export function MapCanvas({
  ref,
  apartments,
  landmarks,
  selectedId,
  route,
  mapType,
  is3D,
  userLocation,
  insets,
  onSelectApartment,
  onSelectLandmark,
  onPressMap,
  onHeadingChange,
}: MapCanvasProps & { ref?: Ref<MapCanvasHandle> }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, PortalMarker>());
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(14);
  const [labeled, setLabeled] = useState<ReadonlySet<string>>(new Set());
  const { colors, dark } = useMapsTheme();

  // Map padding keeps the camera centered in the area the sheet leaves visible.
  const insetsKey = JSON.stringify(insets);
  const appliedInsets = useRef('');

  // Latest values for map event handlers created once.
  /**
   * Apple-style label collision: walk pins in priority order (selected first,
   * then apartments by rating, then campus places) and only label a pin when
   * its label box stays clear of every accepted label and every pin.
   */
  const placeLabels = () => {
    const map = mapRef.current;
    if (!map) return;
    const items = [
      ...[...apartments]
        .sort((a, b) => b.rating - a.rating)
        .map((a) => ({ id: `a:${a.id}`, p: a, name: a.name })),
      ...(map.getZoom() >= 13.4
        ? landmarks.map((l) => ({ id: `l:${l.id}`, p: l, name: l.name }))
        : []),
    ].sort(
      (x, y) => Number(y.id.endsWith(`:${selectedId}`)) - Number(x.id.endsWith(`:${selectedId}`))
    );
    const points = items.map((it) => ({ ...it, xy: map.project([it.p.longitude, it.p.latitude]) }));
    const pins = points.map(({ xy }) => ({
      x0: xy.x - 15,
      x1: xy.x + 15,
      y0: xy.y - 15,
      y1: xy.y + 15,
    }));
    const accepted: typeof pins = [];
    const next = new Set<string>();
    const hit = (a: (typeof pins)[0], b: (typeof pins)[0]) =>
      a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    for (const { id, xy, name } of points) {
      // Campus places get labels only once zoomed in; their pins still block.
      if (id.startsWith('l:') && map.getZoom() < 14.6) continue;
      const w = Math.min(PIN_BOX.width, name.length * 6.6 + 8);
      const box = { x0: xy.x - w / 2, x1: xy.x + w / 2, y0: xy.y + 16, y1: xy.y + 44 };
      const own = pins[points.findIndex((q) => q.id === id)];
      if (accepted.some((b) => hit(box, b)) || pins.some((b) => b !== own && hit(box, b))) continue;
      accepted.push(box);
      next.add(id);
    }
    // The campus name is the lowest-priority label.
    const c = map.project([CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude]);
    const campus = { x0: c.x - 80, x1: c.x + 80, y0: c.y - 16, y1: c.y + 16 };
    if (![...accepted, ...pins].some((b) => hit(campus, b))) next.add('campus-label');
    setLabeled((prev) =>
      prev.size === next.size && [...next].every((id) => prev.has(id)) ? prev : next
    );
  };

  const latest = useRef({ route, onPressMap, onHeadingChange, placeLabels });
  useEffect(() => {
    latest.current = { route, onPressMap, onHeadingChange, placeLabels };
  });
  useEffect(() => {
    if (ready) latest.current.placeLabels();
  }, [ready, apartments, selectedId]);

  useEffect(() => {
    if (!container.current) return;
    const map = new MapLibreMap({
      container: container.current,
      // Plain land color until the basemap style arrives.
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'land',
            type: 'background',
            paint: { 'background-color': colors.groupedBackground },
          },
        ],
      },
      center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
      zoom: 13,
      maxPitch: 70,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    // Open on every listing, framed inside the area the sheet leaves visible.
    map.setPadding(insets);
    appliedInsets.current = JSON.stringify(insets);
    map.fitBounds(
      [
        [INITIAL_BOUNDS.west, INITIAL_BOUNDS.south],
        [INITIAL_BOUNDS.east, INITIAL_BOUNDS.north],
      ],
      { padding: 24, animate: false }
    );
    if (is3D) {
      map.jumpTo({ pitch: PITCH_3D, bearing: BEARING_3D, zoom: map.getZoom() + 0.4 });
    }
    applyStyle(map, mapType, dark);
    map.on('style.load', () => {
      addOverlays(map, latest.current.route);
      setRouteStyle(map, latest.current.route);
      setReady(true);
    });
    map.on('zoom', () => setZoom(map.getZoom()));
    map.on('move', () => latest.current.placeLabels());
    map.on('rotate', () => latest.current.onHeadingChange?.(map.getBearing()));
    map.on('click', (e: { originalEvent: MouseEvent }) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (!target?.closest('.maps-pin')) latest.current.onPressMap();
    });
    const pinMarkers = markers.current;
    return () => {
      map.remove();
      mapRef.current = null;
      pinMarkers.clear();
    };
    // The map is created once; style and camera changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap basemap on map type / appearance change.
  const styleKey = `${mapType}:${dark}`;
  const appliedStyle = useRef(styleKey);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedStyle.current === styleKey) return;
    appliedStyle.current = styleKey;
    applyStyle(map, mapType, dark);
  }, [styleKey, mapType, dark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource('route') as GeoJSONSource | undefined)?.setData(routeFeature(route));
    setRouteStyle(map, route);
  }, [route, ready]);

  const appliedPitch = useRef(is3D);
  useEffect(() => {
    if (appliedPitch.current === is3D) return;
    appliedPitch.current = is3D;
    mapRef.current?.easeTo({
      pitch: is3D ? PITCH_3D : 0,
      bearing: is3D ? BEARING_3D : 0,
      duration: 900,
    });
  }, [is3D]);

  useEffect(() => {
    if (appliedInsets.current === insetsKey) return;
    appliedInsets.current = insetsKey;
    mapRef.current?.easeTo({ padding: JSON.parse(insetsKey), duration: 300 });
  }, [insetsKey]);

  useImperativeHandle(ref, () => ({
    flyTo(target, targetZoom) {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: targetZoom ?? Math.max(map.getZoom(), 15.5),
        padding: insets,
        duration: 900,
        essential: true,
      });
    },
    fitTo(points) {
      const map = mapRef.current;
      if (!map || points.length === 0) return;
      const bounds = new LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      // Added on top of the map's own padding (the sheet insets).
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 17,
        duration: 900,
      });
    },
    resetNorth() {
      mapRef.current?.resetNorthPitch({ duration: 500 });
    },
    zoomBy(delta) {
      const map = mapRef.current;
      if (map) map.easeTo({ zoom: map.getZoom() + delta, duration: 300 });
    },
  }));

  const showLandmarks = zoom >= 13.4;

  const pins: PinSpec[] = [];
  if (zoom >= 13 && zoom < 15.6 && labeled.has('campus-label')) {
    pins.push({
      id: 'campus-label',
      lngLat: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
      interactive: false,
      zIndex: 0,
      node: <CampusLabel />,
    });
  }
  if (showLandmarks) {
    for (const l of landmarks) {
      pins.push({
        id: `l:${l.id}`,
        lngLat: [l.longitude, l.latitude],
        interactive: true,
        zIndex: l.id === selectedId ? 1000 : 1,
        node: (
          <div onClick={() => onSelectLandmark(l.id)}>
            <LandmarkPin
              landmark={l}
              selected={l.id === selectedId}
              showLabel={zoom >= 14.6 && labeled.has(`l:${l.id}`)}
            />
          </div>
        ),
      });
    }
  }
  for (const a of apartments) {
    pins.push({
      id: `a:${a.id}`,
      lngLat: [a.longitude, a.latitude],
      interactive: true,
      zIndex: a.id === selectedId ? 1000 : 10,
      node: (
        <div onClick={() => onSelectApartment(a.id)}>
          <ApartmentPin
            apartment={a}
            selected={a.id === selectedId}
            showLabel={labeled.has(`a:${a.id}`)}
          />
        </div>
      ),
    });
  }
  if (userLocation) {
    pins.push({
      id: 'user',
      lngLat: [userLocation.longitude, userLocation.latitude],
      interactive: false,
      zIndex: 2000,
      node: <UserDot />,
    });
  }

  // Keep one MapLibre marker element per pin; React renders into each via a portal.
  const [elements, setElements] = useState<ReadonlyMap<string, HTMLElement>>(new Map());
  const pinKey = pins.map((p) => `${p.id}@${p.lngLat.join(',')}#${p.zIndex}`).join('|');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const current = markers.current;
    const ids = new Set<string>();
    let changed = false;
    for (const pin of pins) {
      ids.add(pin.id);
      let entry = current.get(pin.id);
      if (!entry) {
        const el = document.createElement('div');
        el.className = pin.interactive ? 'maps-pin' : 'maps-overlay';
        const offset: [number, number] = pin.interactive
          ? [0, PIN_BOX.height * (0.5 - PIN_ANCHOR.y)]
          : [0, 0];
        entry = {
          el,
          marker: new Marker({ element: el, offset }).setLngLat(pin.lngLat).addTo(map),
        };
        current.set(pin.id, entry);
        changed = true;
      }
      entry.marker.setLngLat(pin.lngLat);
      entry.el.style.zIndex = String(pin.zIndex);
    }
    for (const [id, entry] of current) {
      if (!ids.has(id)) {
        entry.marker.remove();
        current.delete(id);
        changed = true;
      }
    }
    if (changed) setElements(new Map([...current].map(([id, e]) => [id, e.el])));
    // pinKey captures everything about `pins` this effect reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinKey, ready]);

  return (
    // `isolation` keeps pin z-indexes from stacking above the sheet.
    <div
      style={{
        position: 'absolute',
        inset: 0,
        isolation: 'isolate',
        background: colors.groupedBackground,
      }}>
      <style>{PIN_CSS}</style>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {pins.map((pin) => {
        const el = elements.get(pin.id);
        return el ? createPortal(pin.node, el, pin.id) : null;
      })}
    </div>
  );
}

// The pin box is mostly empty space; only the pin and label take clicks.
const PIN_CSS = `
.maps-pin, .maps-overlay { pointer-events: none !important; }
.maps-pin > div { pointer-events: none; }
.maps-pin > div > div > div { pointer-events: auto; cursor: pointer; }
.maplibregl-ctrl-attrib.maplibregl-compact { margin: 0 8px 8px 0; }
`;
