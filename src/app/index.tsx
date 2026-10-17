import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useAuth } from '@clerk/expo';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DirectionsPanel } from '@/components/maps/directions-panel';
import { HomePanel } from '@/components/maps/home-panel';
import { LandmarkCard } from '@/components/maps/landmark-card';
import { ListingAssistant } from '@/components/maps/listing-assistant';
import { MapCanvas } from '@/components/maps/map-canvas';
import type { MapCanvasHandle, MapType } from '@/components/maps/map-canvas.types';
import { MapControls } from '@/components/maps/map-controls';
import { MapsSheet, useSheetMetrics, type Detent } from '@/components/maps/maps-sheet';
import { PlaceCard } from '@/components/maps/place-card';
import { SearchBar } from '@/components/maps/search-bar';
import { WeatherBadge } from '@/components/maps/weather-badge';
import { useMapsTheme } from '@/constants/maps-theme';
import { APARTMENTS } from '@/data/apartments';
import { CAMPUS_OUTLINE, LANDMARKS, landmarkById } from '@/data/campus';
import type { Apartment, LatLng, Route, TravelMode } from '@/data/types';
import { useIsClient } from '@/hooks/use-is-client';
import { filterApartments, filterLandmarks, NO_FILTERS, type SortKey } from '@/lib/filters';
import { fetchRoute } from '@/lib/routing';
import { searchListings } from '@/lib/auth-api';
import { listingToApartment } from '@/lib/listing-map';

type Panel =
  | { kind: 'home' }
  | { kind: 'apartment'; id: string }
  | { kind: 'assistant'; id: string }
  | { kind: 'landmark'; id: string }
  | { kind: 'directions'; id: string };

const campusPoints = CAMPUS_OUTLINE.map(([longitude, latitude]) => ({ latitude, longitude }));

function tick() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

export default function Index() {
  // The map layout depends on the window size, which isn't known while the
  // web build is server-rendered — so render the screen on the client only.
  const isClient = useIsClient();
  return isClient ? <MapScreen /> : <View style={styles.root} />;
}

function MapScreen() {
  const { getToken } = useAuth();
  const map = useRef<MapCanvasHandle>(null);
  const safe = useSafeAreaInsets();
  const { dark } = useMapsTheme();
  const { wide, heights, panelWidth } = useSheetMetrics();

  const [panel, setPanel] = useState<Panel>({ kind: 'home' });
  const [detent, setDetent] = useState<Detent>('medium');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>('distance');
  const [saved, setSaved] = useState<string[]>([]);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [is3D, setIs3D] = useState(true);
  const [heading, setHeading] = useState(0);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [destinationId, setDestinationId] = useState('quad');
  const [mode, setMode] = useState<TravelMode>('walk');
  const [route, setRoute] = useState<Route | null>(null);
  const [databaseApartments, setDatabaseApartments] = useState<Apartment[] | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await searchListings(token, { accessibilityTags: [], amenities: [] });
        if (active) setDatabaseApartments(response.listings.map(listingToApartment));
      } catch {
        // The polished map remains useful during local setup before the migration/seed runs.
      }
    })();
    return () => { active = false; };
  }, [getToken]);

  const apartments = databaseApartments ?? APARTMENTS;
  const apartmentById = useMemo(() => Object.fromEntries(apartments.map((apartment) => [apartment.id, apartment])) as Record<string, Apartment>, [apartments]);

  const results = filterApartments(apartments, query, filters, sort, saved);
  const placeResults = filterLandmarks(LANDMARKS, query);

  const selectedId = panel.kind === 'home' ? null : panel.id;
  const selectedApartment =
    panel.kind === 'apartment' || panel.kind === 'directions' || panel.kind === 'assistant' ? apartmentById[panel.id] : null;
  // Keep the selected apartment on the map even if filters would hide it.
  const mapApartments =
    selectedApartment && !results.includes(selectedApartment)
      ? [...results, selectedApartment]
      : results;

  // Fetch a street route whenever directions are showing.
  const directionsFor = panel.kind === 'directions' ? panel.id : null;
  useEffect(() => {
    if (!directionsFor) return;
    const apartment = apartmentById[directionsFor];
    if (!apartment) return;
    const controller = new AbortController();
    fetchRoute(apartment, landmarkById[destinationId], mode, controller.signal)
      .then((r) => {
        setRoute(r);
        map.current?.fitTo(r.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [apartmentById, directionsFor, destinationId, mode]);

  const mapInsets = wide
    ? { top: 0, bottom: 0, left: panelWidth + 24, right: 0 }
    : { top: safe.top, bottom: heights[detent === 'large' ? 'medium' : detent], left: 0, right: 0 };

  const endSearch = () => {
    Keyboard.dismiss();
    setSearching(false);
  };

  const selectApartment = (id: string) => {
    tick();
    endSearch();
    setPanel({ kind: 'apartment', id });
    if (!wide) setDetent('medium');
    map.current?.flyTo(apartmentById[id], 16);
  };

  const selectLandmark = (id: string) => {
    tick();
    endSearch();
    setPanel({ kind: 'landmark', id });
    if (!wide) setDetent('medium');
    map.current?.flyTo(landmarkById[id], 16);
  };

  const closePanel = () => {
    setPanel({ kind: 'home' });
    if (!wide) setDetent('medium');
  };

  const showCampus = () => {
    endSearch();
    setPanel({ kind: 'home' });
    map.current?.fitTo(campusPoints);
  };

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Off', 'Allow location access to see where you are on the map.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUserLocation(here);
      map.current?.flyTo(here, 15);
    } catch {
      Alert.alert('Location Unavailable', "We couldn't find your current location.");
    } finally {
      setLocating(false);
    }
  };

  const toggleSaved = (id: string) => {
    tick();
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  let content;
  if (panel.kind === 'apartment') {
    content = (
      <PlaceCard
        apartment={apartmentById[panel.id]}
        saved={saved.includes(panel.id)}
        destinationId={destinationId}
        onDestinationChange={setDestinationId}
        onToggleSaved={() => toggleSaved(panel.id)}
        onDirections={(m) => {
          setMode(m);
          setPanel({ kind: 'directions', id: panel.id });
        }}
        onAskAI={() => setPanel({ kind: 'assistant', id: panel.id })}
        onClose={closePanel}
      />
    );
  } else if (panel.kind === 'assistant') {
    content = <ListingAssistant apartment={apartmentById[panel.id]} onClose={() => setPanel({ kind: 'apartment', id: panel.id })} />;
  } else if (panel.kind === 'directions') {
    content = (
      <DirectionsPanel
        apartment={apartmentById[panel.id]}
        destinationId={destinationId}
        mode={mode}
        route={route}
        onModeChange={setMode}
        onDestinationChange={setDestinationId}
        onClose={() => {
          setPanel({ kind: 'apartment', id: panel.id });
          map.current?.flyTo(apartmentById[panel.id], 16);
        }}
      />
    );
  } else if (panel.kind === 'landmark') {
    content = (
      <LandmarkCard
        landmark={landmarkById[panel.id]}
        apartments={apartments}
        saved={saved}
        onSelectApartment={selectApartment}
        onClose={closePanel}
      />
    );
  } else {
    content = (
      <HomePanel
        query={query}
        apartments={results}
        landmarks={placeResults}
        filters={filters}
        sort={sort}
        saved={saved}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onSelectApartment={selectApartment}
        onSelectLandmark={selectLandmark}
        onShowCampus={showCampus}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={dark || mapType === 'satellite' ? 'light' : 'dark'} />
      <MapCanvas
        ref={map}
        apartments={mapApartments}
        landmarks={LANDMARKS}
        selectedId={selectedId}
        route={panel.kind === 'directions' ? route : null}
        mapType={mapType}
        is3D={is3D}
        userLocation={userLocation}
        insets={mapInsets}
        onSelectApartment={selectApartment}
        onSelectLandmark={selectLandmark}
        onPressMap={() => {
          if (searching) endSearch();
          else if (panel.kind === 'apartment' || panel.kind === 'landmark') closePanel();
        }}
        onHeadingChange={setHeading}
      />

      <MapControls
        mapType={mapType}
        onMapTypeChange={setMapType}
        is3D={is3D}
        onToggle3D={() => setIs3D((v) => !v)}
        locating={locating}
        onLocate={locate}
        heading={heading}
        onResetNorth={() => map.current?.resetNorth()}
        onZoom={(d) => map.current?.zoomBy(d)}
        wide={wide}
        footer={wide ? <WeatherBadge /> : null}
      />

      {!wide && (
        <View style={[styles.weather, { top: safe.top + 10 }]}>
          <WeatherBadge />
        </View>
      )}

      <MapsSheet
        detent={detent}
        onDetentChange={setDetent}
        header={
          panel.kind === 'home' ? (
            <SearchBar
              value={query}
              onChangeText={setQuery}
              focused={searching}
              onFocus={() => {
                setSearching(true);
                if (!wide) setDetent('large');
              }}
              onCancel={() => {
                setQuery('');
                endSearch();
                if (!wide) setDetent('medium');
              }}
            />
          ) : null
        }>
        {content}
      </MapsSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  weather: { position: 'absolute', left: 10 },
});
