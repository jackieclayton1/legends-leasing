import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

type PlatformNames = Exclude<SymbolViewProps['name'], string>;
export type SFSymbolName = Extract<SymbolViewProps['name'], string>;
export type MaterialSymbolName = NonNullable<PlatformNames['android']>;

type IconProps = {
  /** SF Symbol name (iOS). */
  ios: SFSymbolName;
  /** Material Symbol name (Android + web). */
  md: MaterialSymbolName;
  size?: number;
  color: ColorValue;
  /** iOS only; Material Symbols use their regular weight. */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  style?: StyleProp<ViewStyle>;
};

/** SF Symbols on iOS, Material Symbols on Android and web. */
export function Icon({ ios, md, size = 20, color, weight = 'regular', style }: IconProps) {
  return (
    <SymbolView
      name={{ ios, android: md, web: md }}
      size={size}
      tintColor={color}
      weight={weight}
      style={style}
    />
  );
}
