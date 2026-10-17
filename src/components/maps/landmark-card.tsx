import { StyleSheet, Text, View } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';
import { CATEGORY_STYLE } from '@/data/campus';
import type { Apartment, Landmark } from '@/data/types';
import { estimateTrip, formatDistance, formatDuration } from '@/lib/geo';

import { ApartmentRow } from './home-panel';
import { Icon } from './icon';
import { CircleButton, Group, SectionTitle, Separator, text } from './ui';

/** Campus place card, with the closest apartments to that spot. */
export function LandmarkCard({
  landmark,
  apartments,
  saved,
  onSelectApartment,
  onClose,
}: {
  landmark: Landmark;
  apartments: Apartment[];
  saved: string[];
  onSelectApartment: (id: string) => void;
  onClose: () => void;
}) {
  const { colors } = useMapsTheme();
  const cat = CATEGORY_STYLE[landmark.category];
  const nearby = apartments
    .map((a) => ({ a, trip: estimateTrip(a, landmark, 'walk') }))
    .sort((x, y) => x.trip.seconds - y.trip.seconds)
    .slice(0, 5);

  return (
    <View>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: cat.color }]}>
          <Icon ios={cat.ios} md={cat.md} size={22} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={[text.title, { color: colors.label }]}>{landmark.name}</Text>
          <Text style={[text.subhead, { color: colors.secondaryLabel }]}>
            {cat.label} · The University of Alabama
          </Text>
        </View>
        <CircleButton ios="xmark" md="close" label="Close" onPress={onClose} />
      </View>

      <Group style={styles.blurb}>
        <Text style={[text.body, { color: colors.label }]}>{landmark.blurb}</Text>
      </Group>

      <SectionTitle>Apartments Nearby</SectionTitle>
      <Group>
        {nearby.map(({ a, trip }, i) => (
          <View key={a.id}>
            {i > 0 && <Separator inset={60} />}
            <ApartmentRow
              apartment={a}
              saved={saved.includes(a.id)}
              detail={`${formatDuration(trip.seconds)} walk · ${formatDistance(trip.meters)}`}
              onPress={() => onSelectApartment(a.id)}
            />
          </View>
        ))}
      </Group>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  headerText: { flex: 1 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurb: { padding: 14, marginTop: 16 },
});
