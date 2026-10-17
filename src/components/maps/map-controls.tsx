import { useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMapsTheme } from '@/constants/maps-theme';

import { Icon } from './icon';
import type { MapType } from './map-canvas.types';
import { Glass, Tap, text } from './ui';

/** Floating map buttons: map type, 3D and locate at top right; compass and zoom on web. */
export function MapControls({
  mapType,
  onMapTypeChange,
  is3D,
  onToggle3D,
  locating,
  onLocate,
  heading,
  onResetNorth,
  onZoom,
  wide,
  footer,
}: {
  mapType: MapType;
  onMapTypeChange: (t: MapType) => void;
  is3D: boolean;
  onToggle3D: () => void;
  locating: boolean;
  onLocate: () => void;
  heading: number;
  onResetNorth: () => void;
  onZoom: (delta: number) => void;
  /** Side-panel layout: compass and zoom move to the bottom-right corner. */
  wide: boolean;
  /** Extra content for the bottom-right corner (the weather badge). */
  footer?: ReactNode;
}) {
  const { colors } = useMapsTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const web = Platform.OS === 'web';

  // Compass and zoom (web only — touch screens pinch and twist instead).
  const navigation = (
    <>
      {Math.abs(heading) > 0.5 && (
        <Glass style={[styles.single, { marginTop: 10 }]} interactive>
          <Tap style={styles.button} onPress={onResetNorth} accessibilityLabel="Reset to north">
            <View style={{ transform: [{ rotate: `${-heading}deg` }], alignItems: 'center' }}>
              <View style={[styles.needle, { borderBottomColor: '#FF3B30' }]} />
              <Text style={[styles.compassN, { color: colors.label }]}>N</Text>
            </View>
          </Tap>
        </Glass>
      )}

      <Glass style={[styles.stack, { marginTop: 10 }]} interactive>
        <Tap style={styles.button} onPress={() => onZoom(1)} accessibilityLabel="Zoom in">
          <Icon ios="plus" md="add" size={20} color={colors.label} />
        </Tap>
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />
        <Tap style={styles.button} onPress={() => onZoom(-1)} accessibilityLabel="Zoom out">
          <Icon ios="minus" md="remove" size={20} color={colors.label} />
        </Tap>
      </Glass>
    </>
  );

  return (
    <>
      <View style={[styles.root, { top: insets.top + 10 }]} pointerEvents="box-none">
        <Glass style={styles.stack} interactive>
          <Tap
            style={styles.button}
            onPress={() => setMenuOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel="Map type">
            <Icon
              ios={mapType === 'satellite' ? 'globe.americas.fill' : 'map.fill'}
              md={mapType === 'satellite' ? 'public' : 'map'}
              size={20}
              color={colors.label}
            />
          </Tap>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <Tap style={styles.button} onPress={onToggle3D} accessibilityRole="button">
            <Text style={[styles.label3d, { color: colors.label }]}>{is3D ? '2D' : '3D'}</Text>
          </Tap>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <Tap
            style={styles.button}
            onPress={onLocate}
            accessibilityRole="button"
            accessibilityLabel="Show my location">
            <Icon
              ios={locating ? 'location.fill' : 'location'}
              md="near_me"
              size={19}
              color={colors.tint}
            />
          </Tap>
        </Glass>

        {web && !wide && navigation}

        {menuOpen && (
          <Glass style={styles.menu}>
            <Text style={[text.headline, styles.menuTitle, { color: colors.label }]}>
              Choose Map
            </Text>
            <View style={styles.options}>
              {(
                [
                  { type: 'standard', label: 'Explore', ios: 'map.fill', md: 'map', bg: '#E8E2D2' },
                  {
                    type: 'satellite',
                    label: 'Satellite',
                    ios: 'globe.americas.fill',
                    md: 'public',
                    bg: '#3D5A3A',
                  },
                ] as const
              ).map((o) => {
                const active = mapType === o.type;
                return (
                  <Tap
                    key={o.type}
                    onPress={() => {
                      onMapTypeChange(o.type);
                      setMenuOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={styles.option}>
                    <View
                      style={[
                        styles.preview,
                        {
                          backgroundColor: o.bg,
                          borderColor: active ? colors.tint : 'transparent',
                        },
                      ]}>
                      <Icon
                        ios={o.ios}
                        md={o.md}
                        size={26}
                        color={o.type === 'satellite' ? '#fff' : '#6B5B3A'}
                      />
                    </View>
                    <Text
                      style={[
                        text.footnote,
                        { color: active ? colors.tint : colors.label, fontWeight: '600' },
                      ]}>
                      {o.label}
                    </Text>
                  </Tap>
                );
              })}
            </View>
          </Glass>
        )}
      </View>
      {(footer || (web && wide)) && (
        <View style={[styles.bottomRight, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
          {web && wide && navigation}
          {footer ? <View style={{ marginTop: 10 }}>{footer}</View> : null}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', right: 10, alignItems: 'flex-end' },
  bottomRight: { position: 'absolute', right: 10, alignItems: 'flex-end' },
  stack: {
    width: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  },
  single: {
    width: 44,
    height: 44,
    borderRadius: 22,
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  label3d: { fontSize: 15, fontWeight: '700' },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  compassN: { fontSize: 11, fontWeight: '700', marginTop: -1 },
  menu: {
    position: 'absolute',
    top: 0,
    right: 54,
    width: 230,
    padding: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
    boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
  },
  menuTitle: { marginBottom: 10 },
  options: { flexDirection: 'row', gap: 12 },
  option: { flex: 1, alignItems: 'center', gap: 6 },
  preview: {
    width: '100%',
    height: 64,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
