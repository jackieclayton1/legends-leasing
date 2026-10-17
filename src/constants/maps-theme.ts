import { useColorScheme } from 'react-native';

// iOS system colors, so the UI reads like Apple Maps in both appearances.
export const MapsColors = {
  light: {
    label: '#000000',
    secondaryLabel: 'rgba(60, 60, 67, 0.6)',
    tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
    fill: 'rgba(120, 120, 128, 0.12)',
    fillStrong: 'rgba(120, 120, 128, 0.2)',
    separator: 'rgba(60, 60, 67, 0.18)',
    // Translucent so the map shows through, like Apple's glass panels.
    sheet: 'rgba(246, 246, 246, 0.74)',
    sheetSolid: '#F2F2F7',
    card: 'rgba(255, 255, 255, 0.66)',
    groupedBackground: '#F2F2F7',
    tint: '#007AFF',
    green: '#34C759',
    orange: '#FF9500',
    star: '#FF9500',
    crimson: '#9E1B32',
    pinHalo: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.16)',
  },
  dark: {
    label: '#FFFFFF',
    secondaryLabel: 'rgba(235, 235, 245, 0.6)',
    tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
    fill: 'rgba(118, 118, 128, 0.24)',
    fillStrong: 'rgba(118, 118, 128, 0.36)',
    separator: 'rgba(84, 84, 88, 0.6)',
    sheet: 'rgba(30, 30, 32, 0.74)',
    sheetSolid: '#1C1C1E',
    card: 'rgba(72, 72, 76, 0.55)',
    groupedBackground: '#1C1C1E',
    tint: '#0A84FF',
    green: '#30D158',
    orange: '#FF9F0A',
    star: '#FF9F0A',
    crimson: '#D7375A',
    pinHalo: '#1C1C1E',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export type MapsPalette = { [K in keyof typeof MapsColors.light]: string };

export function useMapsTheme(): { colors: MapsPalette; dark: boolean } {
  const dark = useColorScheme() === 'dark';
  return { colors: dark ? MapsColors.dark : MapsColors.light, dark };
}

/** Apple-blue route line, plus its outline. */
export const ROUTE_COLOR = '#0A84FF';
export const ROUTE_CASING = '#0060DF';
