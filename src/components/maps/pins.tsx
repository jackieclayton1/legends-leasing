import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_STYLE } from '@/data/campus';
import type { Apartment, Landmark } from '@/data/types';
import { formatPrice } from '@/lib/geo';
import { useMapsTheme } from '@/constants/maps-theme';

import { Icon } from './icon';

/**
 * Every pin renders in a fixed-size box whose anchor point (the map
 * coordinate) sits at PIN_ANCHOR. Resting pins are centered on it; the
 * selected balloon pin's tail touches it. Labels hang below.
 */
export const PIN_BOX = { width: 132, height: 104 };
export const PIN_ANCHOR = { x: 0.5, y: 54 / 104 };
const ANCHOR_Y = 54;

type PinProps = {
  color: string;
  ios: Parameters<typeof Icon>[0]['ios'];
  md: Parameters<typeof Icon>[0]['md'];
  title: string;
  subtitle?: string;
  selected: boolean;
  showLabel: boolean;
  size?: number;
};

function Pin({ color, ios, md, title, subtitle, selected, showLabel, size = 28 }: PinProps) {
  const { colors } = useMapsTheme();
  const labelTop = selected ? ANCHOR_Y + 4 : ANCHOR_Y + size / 2 + 3;

  return (
    <View style={styles.box} pointerEvents="box-none">
      {selected ? (
        <View style={[styles.balloonWrap, { top: ANCHOR_Y - 54 }]}>
          <View style={[styles.balloon, { backgroundColor: color, borderColor: colors.pinHalo }]}>
            <Icon ios={ios} md={md} size={24} color="#fff" weight="semibold" />
          </View>
          <View style={[styles.tail, { borderTopColor: color }]} />
        </View>
      ) : (
        <View
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              top: ANCHOR_Y - size / 2,
              left: (PIN_BOX.width - size) / 2,
              backgroundColor: color,
              borderColor: colors.pinHalo,
            },
          ]}>
          <Icon ios={ios} md={md} size={size * 0.55} color="#fff" weight="semibold" />
        </View>
      )}
      {(showLabel || selected) && (
        <View style={[styles.label, { top: labelTop }]} pointerEvents="none">
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: selected ? color : colors.label, textShadowColor: colors.pinHalo },
            ]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[
                styles.subtitle,
                { color: colors.secondaryLabel, textShadowColor: colors.pinHalo },
              ]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function ApartmentPin({
  apartment,
  selected,
  showLabel,
}: {
  apartment: Apartment;
  selected: boolean;
  showLabel: boolean;
}) {
  const { colors } = useMapsTheme();
  const unit = apartment.leaseType === 'By the bed' ? '/bed' : '/mo';
  return (
    <Pin
      color={colors.crimson}
      ios="house.fill"
      md="home"
      title={apartment.name}
      subtitle={`from ${formatPrice(apartment.priceMin)}${unit}`}
      selected={selected}
      showLabel={showLabel}
      size={30}
    />
  );
}

export function LandmarkPin({
  landmark,
  selected,
  showLabel,
}: {
  landmark: Landmark;
  selected: boolean;
  showLabel: boolean;
}) {
  const style = CATEGORY_STYLE[landmark.category];
  return (
    <Pin
      color={style.color}
      ios={style.ios}
      md={style.md}
      title={landmark.name}
      selected={selected}
      showLabel={showLabel}
      size={24}
    />
  );
}

export function CampusLabel() {
  const { colors } = useMapsTheme();
  return (
    <View style={styles.campusLabel} pointerEvents="none">
      <Text style={[styles.campusText, { color: '#8B6B3E', textShadowColor: colors.pinHalo }]}>
        THE UNIVERSITY{'\n'}OF ALABAMA
      </Text>
    </View>
  );
}

export function UserDot() {
  return (
    <View style={styles.userHalo}>
      <View style={styles.userDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: PIN_BOX.width,
    height: PIN_BOX.height,
  },
  dot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  balloonWrap: {
    position: 'absolute',
    left: (PIN_BOX.width - 46) / 2,
    width: 46,
    alignItems: 'center',
  },
  balloon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
  },
  tail: {
    marginTop: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    textAlign: 'center',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 0 },
  },
  campusLabel: {
    width: 180,
    alignItems: 'center',
  },
  campusText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 0 },
  },
  userHalo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
  },
});
