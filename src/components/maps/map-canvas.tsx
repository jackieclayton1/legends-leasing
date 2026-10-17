import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { CAMPUS_CENTER, INITIAL_BOUNDS } from '@/data/campus';
import { ROUTE_CASING, ROUTE_COLOR, useMapsTheme } from '@/constants/maps-theme';

import type { MapCanvasHandle, MapCanvasProps } from './map-canvas.types';
import { ApartmentPin, CampusLabel, LandmarkPin, PIN_ANCHOR } from './pins';

/**
 * Native map. With no `provider`, react-native-maps uses Apple MapKit on iOS
 * (the real Apple Maps basemap) and Google Maps on Android.
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
}: MapCanvasProps & { ref?: Ref<MapCanvasHandle> }) {
  const map = useRef<MapView>(null);
  const { width } = useWindowDimensions();
  const { dark } = useMapsTheme();
  const [zoom, setZoom] = useState(14);

  const zoomToDelta = (z: number) => (360 * (width / 256)) / 2 ** z;

  useImperativeHandle(ref, () => ({
    flyTo(target, targetZoom) {
      const delta = zoomToDelta(targetZoom ?? Math.max(zoom, 15.5));
      map.current?.animateToRegion({ ...target, latitudeDelta: delta, longitudeDelta: delta }, 650);
    },
    fitTo(points) {
      map.current?.fitToCoordinates(points, {
        edgePadding: {
          top: insets.top + 60,
          bottom: insets.bottom + 60,
          left: insets.left + 60,
          right: insets.right + 60,
        },
        animated: true,
      });
    },
    resetNorth() {
      map.current?.animateCamera({ heading: 0 });
    },
    async zoomBy(delta) {
      const camera = await map.current?.getCamera();
      if (!camera) return;
      if (Platform.OS === 'ios' && camera.altitude) {
        map.current?.animateCamera({ altitude: camera.altitude / 2 ** delta });
      } else if (camera.zoom != null) {
        map.current?.animateCamera({ zoom: camera.zoom + delta });
      }
    },
  }));

  // Tilt into 3D (MapKit shows extruded buildings when pitched).
  useEffect(() => {
    map.current?.animateCamera({ pitch: is3D ? 60 : 0 }, { duration: 600 });
  }, [is3D]);

  const onRegionChangeComplete = (region: Region) => {
    setZoom(Math.log2((360 * (width / 256)) / region.longitudeDelta));
  };

  const nativeMapType =
    mapType === 'standard'
      ? 'standard'
      : Platform.OS === 'ios' && is3D
        ? 'hybridFlyover'
        : 'hybrid';

  const routeCoords = route?.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

  const showAptLabels = zoom >= 13.6;
  const showLandmarks = zoom >= 13.4;
  const showLandmarkLabels = zoom >= 14.6;

  return (
    <MapView
      ref={map}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: (INITIAL_BOUNDS.north + INITIAL_BOUNDS.south) / 2,
        longitude: (INITIAL_BOUNDS.east + INITIAL_BOUNDS.west) / 2,
        latitudeDelta: INITIAL_BOUNDS.north - INITIAL_BOUNDS.south,
        longitudeDelta: INITIAL_BOUNDS.east - INITIAL_BOUNDS.west,
      }}
      mapType={nativeMapType}
      mapPadding={insets}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      showsBuildings
      showsCompass
      showsScale
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      pitchEnabled
      rotateEnabled
      onMapReady={() =>
        // Re-fit once the sheet's padding is known so every listing is in view.
        map.current?.fitToCoordinates(
          [
            { latitude: INITIAL_BOUNDS.north, longitude: INITIAL_BOUNDS.west },
            { latitude: INITIAL_BOUNDS.south, longitude: INITIAL_BOUNDS.east },
          ],
          { edgePadding: insets, animated: false }
        )
      }
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={(e) => {
        if (e.nativeEvent.action !== 'marker-press') onPressMap();
      }}>
      {zoom >= 13 && zoom < 15.6 && (
        <Marker coordinate={CAMPUS_CENTER} anchor={{ x: 0.5, y: 0.5 }} tappable={false}>
          <CampusLabel />
        </Marker>
      )}

      {routeCoords && route && (
        <>
          <Polyline
            coordinates={routeCoords}
            strokeColor={ROUTE_CASING}
            strokeWidth={route.mode === 'walk' ? 0 : 9}
            lineCap="round"
            lineJoin="round"
          />
          <Polyline
            coordinates={routeCoords}
            strokeColor={ROUTE_COLOR}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={route.mode === 'walk' ? [1, 10] : undefined}
          />
        </>
      )}

      {showLandmarks &&
        landmarks.map((l) => (
          <Marker
            key={`${l.id}:${l.id === selectedId}:${showLandmarkLabels}`}
            coordinate={l}
            anchor={PIN_ANCHOR}
            zIndex={l.id === selectedId ? 1000 : 1}
            stopPropagation
            onPress={() => onSelectLandmark(l.id)}>
            <LandmarkPin
              landmark={l}
              selected={l.id === selectedId}
              showLabel={showLandmarkLabels}
            />
          </Marker>
        ))}

      {apartments.map((a) => (
        <Marker
          key={`${a.id}:${a.id === selectedId}:${showAptLabels}`}
          coordinate={a}
          anchor={PIN_ANCHOR}
          zIndex={a.id === selectedId ? 1000 : 10}
          stopPropagation
          onPress={() => onSelectApartment(a.id)}>
          <ApartmentPin apartment={a} selected={a.id === selectedId} showLabel={showAptLabels} />
        </Marker>
      ))}
    </MapView>
  );
}
