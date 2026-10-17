import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Translucent material for floating chrome: Liquid Glass on iOS 26+,
 * a system blur elsewhere (CSS backdrop-filter on web).
 */
export function Glass({
  style,
  children,
  interactive,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  interactive?: boolean;
}) {
  const { colors, dark } = useMapsTheme();
  if (liquidGlass) {
    return (
      <GlassView style={style} glassEffectStyle="regular" isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            overflow: 'hidden',
            backgroundColor: colors.sheet,
            backdropFilter: 'saturate(180%) blur(28px)',
            boxShadow: `inset 0 0 0 0.5px ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)'}`,
          } as ViewStyle,
          style,
        ]}>
        {children}
      </View>
    );
  }
  if (Platform.OS === 'android') {
    return (
      <View style={[{ overflow: 'hidden', backgroundColor: colors.sheetSolid }, style]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView
      intensity={70}
      tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      style={[{ overflow: 'hidden' }, style]}>
      {children}
    </BlurView>
  );
}

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Pressable with the subtle iOS dim-on-press feedback. */
export function Tap({ style, children, ...props }: PressProps) {
  return (
    <Pressable
      hitSlop={6}
      {...props}
      style={({ pressed }) => [style, pressed && { opacity: 0.55 }]}>
      {children}
    </Pressable>
  );
}

export function CircleButton({
  ios,
  md,
  onPress,
  label,
  size = 30,
  tint,
}: {
  ios: SFSymbolName;
  md: MaterialSymbolName;
  onPress: () => void;
  label: string;
  size?: number;
  tint?: string;
}) {
  const { colors } = useMapsTheme();
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon
        ios={ios}
        md={md}
        size={size * 0.5}
        color={tint ?? colors.secondaryLabel}
        weight="bold"
      />
    </Tap>
  );
}

export function Chip({
  label,
  active,
  onPress,
  ios,
  md,
  menu,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  ios?: SFSymbolName;
  md?: MaterialSymbolName;
  /** Shows a chevron, for chips that cycle through options. */
  menu?: boolean;
}) {
  const { colors } = useMapsTheme();
  const fg = active ? '#fff' : colors.label;
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, { backgroundColor: active ? colors.tint : colors.card }]}>
      {ios && md ? <Icon ios={ios} md={md} size={15} color={fg} weight="semibold" /> : null}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
      {menu ? (
        <Icon ios="chevron.down" md="keyboard_arrow_down" size={13} color={fg} weight="bold" />
      ) : null}
    </Tap>
  );
}

export function SectionTitle({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  const { colors } = useMapsTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: colors.label }]}>{children}</Text>
      {trailing}
    </View>
  );
}

/** Rounded inset group, like an iOS grouped table section. */
export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useMapsTheme();
  return <View style={[styles.group, { backgroundColor: colors.card }, style]}>{children}</View>;
}

export function Separator({ inset = 16 }: { inset?: number }) {
  const { colors } = useMapsTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginLeft: inset,
        backgroundColor: colors.separator,
      }}
    />
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const { colors } = useMapsTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Icon ios="star.fill" md="star" size={size} color={colors.star} />
      <Text style={{ fontSize: size + 1, fontWeight: '600', color: colors.label }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export const text = StyleSheet.create({
  largeTitle: { fontSize: 26, lineHeight: 31, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '700' },
  headline: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 20 },
  subhead: { fontSize: 14, lineHeight: 19 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  chipText: { fontSize: 16, fontWeight: '500' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  group: { borderRadius: 18, overflow: 'hidden', borderCurve: 'continuous' },
});
