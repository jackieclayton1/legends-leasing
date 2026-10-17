import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';
import { CAMPUS_CENTER } from '@/data/campus';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';
import { Glass } from './ui';

type Weather = { temp: number; code: number; aqi: number | null };

// WMO weather codes → glyphs.
function weatherGlyph(code: number): { ios: SFSymbolName; md: MaterialSymbolName; color: string } {
  if (code === 0) return { ios: 'sun.max.fill', md: 'clear_day', color: '#FFB800' };
  if (code <= 3) return { ios: 'cloud.sun.fill', md: 'partly_cloudy_day', color: '#8E8E93' };
  if (code <= 48) return { ios: 'cloud.fog.fill', md: 'foggy', color: '#8E8E93' };
  if (code <= 67 || (code >= 80 && code <= 82)) {
    return { ios: 'cloud.rain.fill', md: 'rainy', color: '#4A90D9' };
  }
  if (code <= 86) return { ios: 'cloud.snow.fill', md: 'weather_snowy', color: '#8E8E93' };
  return { ios: 'cloud.bolt.rain.fill', md: 'thunderstorm', color: '#8E8E93' };
}

function aqiColor(aqi: number) {
  if (aqi <= 50) return '#34C759';
  if (aqi <= 100) return '#FFCC00';
  if (aqi <= 150) return '#FF9500';
  return '#FF3B30';
}

const { latitude, longitude } = CAMPUS_CENTER;

/** Current Tuscaloosa temperature and air quality from Open-Meteo (free, no key). */
export function WeatherBadge() {
  const { colors } = useMapsTheme();
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const get = (url: string) =>
      fetch(url, { signal: controller.signal }).then((r) => (r.ok ? r.json() : null));
    Promise.all([
      get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          '&current=temperature_2m,weather_code&temperature_unit=fahrenheit'
      ),
      get(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}` +
          `&longitude=${longitude}&current=us_aqi`
      ).catch(() => null),
    ])
      .then(([forecast, air]) => {
        if (!forecast?.current) return;
        setWeather({
          temp: Math.round(forecast.current.temperature_2m),
          code: forecast.current.weather_code,
          aqi: air?.current?.us_aqi ?? null,
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!weather) return null;
  const glyph = weatherGlyph(weather.code);

  return (
    <Glass style={styles.badge}>
      <View style={styles.row}>
        <Icon ios={glyph.ios} md={glyph.md} size={20} color={glyph.color} />
        <Text style={[styles.temp, { color: colors.label }]}>{weather.temp}°</Text>
      </View>
      {weather.aqi != null && (
        <View style={styles.row}>
          <Text style={[styles.aqi, { color: colors.label }]}>AQI {weather.aqi}</Text>
          <View style={[styles.dot, { backgroundColor: aqiColor(weather.aqi) }]} />
        </View>
      )}
    </Glass>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    gap: 1,
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  temp: { fontSize: 22, fontWeight: '600' },
  aqi: { fontSize: 13, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
