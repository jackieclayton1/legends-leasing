import type {
  LayerSpecification,
  LightSpecification,
  SkySpecification,
  StyleSpecification,
} from 'maplibre-gl';

/**
 * Repaints OpenFreeMap's "liberty" basemap (OpenMapTiles schema) in Apple
 * Maps' palette: cream land, soft green parks, sky-blue water, white
 * streets with uppercase gray names, and warm-white 3D buildings.
 */
const PALETTES = {
  light: {
    land: '#F7F4ED',
    water: '#9DD3F7',
    waterLabel: '#3E87C6',
    park: '#C5E8AE',
    wood: '#B7E09D',
    campus: '#EFE7D6',
    hospital: '#F8E0E2',
    pitch: '#CDEBB7',
    building: '#E9E5DD',
    buildingOutline: '#DCD7CD',
    building3d: '#EEEAE3',
    minorRoad: '#FFFFFF',
    minorCasing: '#DED8CE',
    majorRoad: '#FFFFFF',
    majorCasing: '#D2CBBF',
    highway: '#FFD88C',
    highwayCasing: '#E9B964',
    path: '#FFFFFF',
    rail: '#C9C3B8',
    roadLabel: '#7C776F',
    placeLabel: '#8C867C',
    cityLabel: '#3C3A36',
    halo: '#FFFFFF',
    sky: '#BFE1F8',
    horizon: '#EAF4FB',
  },
  dark: {
    land: '#25262A',
    water: '#1B3A5C',
    waterLabel: '#6FA8DC',
    park: '#22382A',
    wood: '#20352A',
    campus: '#2E2B26',
    hospital: '#3A2A2D',
    pitch: '#26402F',
    building: '#323337',
    buildingOutline: '#2A2B2F',
    building3d: '#3A3B41',
    minorRoad: '#45464C',
    minorCasing: '#2D2E33',
    majorRoad: '#55565D',
    majorCasing: '#34353A',
    highway: '#7D6A45',
    highwayCasing: '#5A4C33',
    path: '#4A4B50',
    rail: '#4B4B50',
    roadLabel: '#A3A3A8',
    placeLabel: '#8E8E93',
    cityLabel: '#D8D8DC',
    halo: '#1C1C1E',
    sky: '#0F1A2A',
    horizon: '#1F2A38',
  },
};

type Palette = (typeof PALETTES)['light'];

function paintFor(layer: LayerSpecification, p: Palette): Record<string, unknown> | null {
  const id = layer.id;
  const src = 'source-layer' in layer ? layer['source-layer'] : undefined;

  if (layer.type === 'background') return { 'background-color': p.land };

  if (src === 'water' && layer.type === 'fill') return { 'fill-color': p.water, 'fill-opacity': 1 };
  if (src === 'waterway' && layer.type === 'line') return { 'line-color': p.water };
  if ((src === 'waterway' || src === 'water_name') && layer.type === 'symbol') {
    return { 'text-color': p.waterLabel, 'text-halo-color': p.halo };
  }

  if (id === 'park')
    return { 'fill-color': p.park, 'fill-opacity': 1, 'fill-outline-color': p.park };
  if (id === 'park_outline') return { 'line-color': p.park };
  if (id === 'landcover_wood') return { 'fill-color': p.wood, 'fill-opacity': 0.9 };
  if (id === 'landcover_grass') return { 'fill-color': p.park, 'fill-opacity': 0.9 };
  if (id === 'landuse_residential') return { 'fill-opacity': 0 };
  if (id === 'landuse_school') return { 'fill-color': p.campus };
  if (id === 'landuse_hospital') return { 'fill-color': p.hospital };
  if (id === 'landuse_cemetery' || id === 'landuse_pitch' || id === 'landuse_track') {
    return { 'fill-color': p.pitch };
  }

  if (id === 'building') {
    return { 'fill-color': p.building, 'fill-outline-color': p.buildingOutline };
  }
  if (id === 'building-3d') {
    return { 'fill-extrusion-color': p.building3d, 'fill-extrusion-opacity': 0.92 };
  }

  if (src === 'transportation' && layer.type === 'line') {
    if (id.includes('rail')) return { 'line-color': p.rail };
    if (id.includes('path_pedestrian')) return { 'line-color': p.path };
    const casing = id.includes('casing');
    const highway = id.includes('motorway');
    const major = /trunk|primary|secondary|tertiary|link/.test(id);
    if (highway) return { 'line-color': casing ? p.highwayCasing : p.highway };
    if (major) return { 'line-color': casing ? p.majorCasing : p.majorRoad };
    return { 'line-color': casing ? p.minorCasing : p.minorRoad };
  }

  if (src === 'transportation_name' && id.startsWith('highway-name')) {
    return { 'text-color': p.roadLabel, 'text-halo-color': p.halo, 'text-halo-width': 1.4 };
  }
  if (src === 'place') {
    const city = /city|town|village|capital/.test(id);
    return {
      'text-color': city ? p.cityLabel : p.placeLabel,
      'text-halo-color': p.halo,
      'text-halo-width': 1.4,
    };
  }
  return null;
}

function layoutFor(layer: LayerSpecification): Record<string, unknown> | null {
  const src = 'source-layer' in layer ? layer['source-layer'] : undefined;
  // Our own pins replace the basemap's points of interest, as in Apple's
  // search results.
  if (src === 'poi') return { visibility: 'none' };
  // Apple sets street and neighborhood names in small, tracked capitals.
  if (layer.id.startsWith('highway-name') || layer.id === 'label_other') {
    return { 'text-transform': 'uppercase', 'text-letter-spacing': 0.08 };
  }
  return null;
}

export function appleStyle(style: StyleSpecification, dark: boolean): StyleSpecification {
  const p = dark ? PALETTES.dark : PALETTES.light;
  const layers = style.layers
    .filter((l) => l.id !== 'road_area_pattern' && l.id !== 'landcover_wetland')
    .map((layer) => {
      const paint = paintFor(layer, p);
      const layout = layoutFor(layer);
      if (!paint && !layout) return layer;
      return {
        ...layer,
        paint: { ...('paint' in layer ? layer.paint : {}), ...paint },
        layout: { ...('layout' in layer ? layer.layout : {}), ...layout },
      } as LayerSpecification;
    });

  // Soft, high sun so extruded buildings get gentle Apple-like shading.
  const light: LightSpecification = {
    anchor: 'viewport',
    color: '#FFFFFF',
    intensity: dark ? 0.25 : 0.35,
    position: [1.3, 210, 35],
  };
  // Sky and haze at the horizon when the camera is tilted.
  const sky: SkySpecification = {
    'sky-color': p.sky,
    'horizon-color': p.horizon,
    'fog-color': p.land,
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.7,
    'fog-ground-blend': 0.85,
    'atmosphere-blend': 0,
  };

  return { ...style, layers, light, sky };
}

/** First layer id matching `test`, for inserting our overlays beneath labels. */
export function firstLayerId(
  style: StyleSpecification | undefined,
  test: (l: LayerSpecification) => boolean
) {
  return style?.layers.find(test)?.id;
}
