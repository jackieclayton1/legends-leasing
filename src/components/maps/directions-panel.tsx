import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';
import { COMMUTE_DESTINATIONS, landmarkById } from '@/data/campus';
import type { Apartment, Route, TravelMode } from '@/data/types';
import { formatDistance, formatDuration, MODES } from '@/lib/geo';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';
import { Chip, CircleButton, Group, Separator, Tap, text } from './ui';

const MODE_GLYPH: Record<TravelMode, { ios: SFSymbolName; md: MaterialSymbolName }> = {
  walk: { ios: 'figure.walk', md: 'directions_walk' },
  bike: { ios: 'bicycle', md: 'directions_bike' },
  drive: { ios: 'car.fill', md: 'directions_car' },
};

// Apple Maps URL scheme travel flags (no cycling flag; it picks the default mode).
const APPLE_DIRFLG: Record<TravelMode, string> = { walk: 'w', bike: '', drive: 'd' };

export function DirectionsPanel({
  apartment,
  destinationId,
  mode,
  route,
  onModeChange,
  onDestinationChange,
  onClose,
}: {
  apartment: Apartment;
  destinationId: string;
  mode: TravelMode;
  route: Route | null;
  onModeChange: (mode: TravelMode) => void;
  onDestinationChange: (id: string) => void;
  onClose: () => void;
}) {
  const { colors } = useMapsTheme();
  const destination = landmarkById[destinationId];

  const openInAppleMaps = () => {
    const flag = APPLE_DIRFLG[mode];
    Linking.openURL(
      `https://maps.apple.com/?saddr=${apartment.latitude},${apartment.longitude}` +
        `&daddr=${destination.latitude},${destination.longitude}` +
        (flag ? `&dirflg=${flag}` : '')
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[text.largeTitle, styles.flex, { color: colors.label }]}>Directions</Text>
        <CircleButton ios="xmark" md="close" label="Close directions" onPress={onClose} />
      </View>

      <Group style={styles.endpoints}>
        <View style={styles.endpoint}>
          <View style={[styles.dot, { backgroundColor: colors.crimson }]}>
            <Icon ios="house.fill" md="home" size={12} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={[text.footnote, { color: colors.secondaryLabel }]}>From</Text>
            <Text style={[text.headline, { color: colors.label }]}>{apartment.name}</Text>
          </View>
        </View>
        <Separator inset={52} />
        <View style={styles.endpoint}>
          <View style={[styles.dot, { backgroundColor: colors.tint }]}>
            <Icon ios="mappin" md="location_on" size={12} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={[text.footnote, { color: colors.secondaryLabel }]}>To</Text>
            <Text style={[text.headline, { color: colors.label }]}>{destination.name}</Text>
          </View>
        </View>
      </Group>

      <View style={[styles.segmented, { backgroundColor: colors.fill }]}>
        {(Object.keys(MODES) as TravelMode[]).map((m) => {
          const active = m === mode;
          return (
            <Tap
              key={m}
              onPress={() => onModeChange(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && { backgroundColor: colors.card }]}>
              <Icon
                ios={MODE_GLYPH[m].ios}
                md={MODE_GLYPH[m].md}
                size={16}
                color={active ? colors.label : colors.secondaryLabel}
              />
              <Text
                style={[
                  text.footnote,
                  { color: active ? colors.label : colors.secondaryLabel, fontWeight: '600' },
                ]}>
                {MODES[m].label}
              </Text>
            </Tap>
          );
        })}
      </View>

      <Group style={styles.result}>
        {route && route.mode === mode && route.to === destination ? (
          <>
            <View style={styles.flex}>
              <Text style={[styles.eta, { color: colors.label }]}>
                {formatDuration(route.seconds)}
              </Text>
              <Text style={[text.subhead, { color: colors.secondaryLabel }]}>
                {formatDistance(route.meters)}
                {route.approximate ? ' · estimated' : ' · via local streets'}
              </Text>
            </View>
            <Tap
              onPress={openInAppleMaps}
              style={[styles.go, { backgroundColor: colors.green }]}
              accessibilityRole="button"
              accessibilityLabel="Open in Apple Maps">
              <Text style={styles.goText}>GO</Text>
            </Tap>
          </>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.secondaryLabel} />
            <Text style={[text.subhead, { color: colors.secondaryLabel }]}>Finding route…</Text>
          </View>
        )}
      </Group>

      <Text style={[text.footnote, styles.label, { color: colors.secondaryLabel }]}>
        CHANGE DESTINATION
      </Text>
      <View style={styles.chips}>
        {COMMUTE_DESTINATIONS.map((id) => (
          <Chip
            key={id}
            label={landmarkById[id].name}
            active={id === destinationId}
            onPress={() => onDestinationChange(id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  endpoints: { marginTop: 14 },
  endpoint: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingLeft: 16 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', borderRadius: 10, padding: 2, marginTop: 14 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 8,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 14,
    minHeight: 84,
  },
  eta: { fontSize: 28, fontWeight: '700' },
  go: {
    width: 64,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { marginTop: 20, marginBottom: 8, marginLeft: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
