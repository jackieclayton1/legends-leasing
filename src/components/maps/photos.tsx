import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Apartment } from '@/data/types';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';

type Glyph = { ios: SFSymbolName; md: MaterialSymbolName };

const AMENITY_ICONS: [RegExp, Glyph][] = [
  [/pool|lazy river|hot tub|sauna/i, { ios: 'figure.pool.swim', md: 'pool' }],
  [/gym|fitness/i, { ios: 'dumbbell.fill', md: 'fitness_center' }],
  [/study|computer/i, { ios: 'book.fill', md: 'menu_book' }],
  [/parking|garage|ev/i, { ios: 'car.fill', md: 'local_parking' }],
  [/pet|dog/i, { ios: 'pawprint.fill', md: 'pets' }],
  [/washer|laundry/i, { ios: 'washer.fill', md: 'local_laundry_service' }],
  [/shuttle|bus/i, { ios: 'bus.fill', md: 'directions_bus' }],
  [/rooftop|sky|balcon|porch|terrace|deck/i, { ios: 'sun.max.fill', md: 'deck' }],
  [/coffee/i, { ios: 'cup.and.saucer.fill', md: 'coffee' }],
  [/volleyball|basketball|golf|game/i, { ios: 'sportscourt.fill', md: 'sports_basketball' }],
  [/yard|trail|lake|river/i, { ios: 'leaf.fill', md: 'park' }],
  [/living/i, { ios: 'sofa.fill', md: 'chair' }],
  [/bedroom/i, { ios: 'bed.double.fill', md: 'bed' }],
  [/kitchen/i, { ios: 'refrigerator.fill', md: 'kitchen' }],
  [/exterior/i, { ios: 'building.2.fill', md: 'apartment' }],
];

export const amenityIcon = (name: string): Glyph =>
  AMENITY_ICONS.find(([re]) => re.test(name))?.[1] ?? { ios: 'sparkles', md: 'star' };

/** Placeholder "photos" for a listing: exterior, rooms, then top amenities. */
export function photoCaptions(a: Apartment) {
  return ['Exterior', 'Living Room', 'Bedroom', 'Kitchen', ...a.amenities.slice(0, 2)];
}

/**
 * Stand-in for a listing photo: the property's gradient with a glyph.
 * Swap for real images (expo-image) once listings have photography.
 */
export function PhotoTile({
  apartment,
  caption,
  index,
  showCaption,
  style,
}: {
  apartment: Apartment;
  caption: string;
  index: number;
  showCaption?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [a, b] = apartment.palette;
  const glyph = amenityIcon(caption);
  return (
    <LinearGradient
      colors={index % 2 ? [b, a] : [a, b]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tile, style]}>
      <View style={styles.sheen} />
      <Icon
        ios={glyph.ios}
        md={glyph.md}
        size={index === 0 ? 44 : 32}
        color="rgba(255,255,255,0.9)"
      />
      {showCaption && <Text style={styles.caption}>{caption}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  caption: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
