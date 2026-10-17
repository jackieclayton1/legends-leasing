import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useMapsTheme } from '@/constants/maps-theme';

import { Glass } from './ui';

export type Detent = 'peek' | 'medium' | 'large';

/** Width at which the sheet becomes an iPad/Mac-style side panel. */
export const WIDE_BREAKPOINT = 768;
const PANEL_MIN = 380;
const PANEL_MAX = 440;
const PEEK_HEIGHT = 78;
const SIDE_MARGIN = 8;

export function useSheetMetrics() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= WIDE_BREAKPOINT;
  const large = height - insets.top - 8;
  const heights: Record<Detent, number> = {
    peek: PEEK_HEIGHT + insets.bottom,
    medium: Math.round(height * 0.46),
    large,
  };
  // Side panel takes about a third of the window, like Maps on iPad and Mac.
  const panelWidth = Math.round(Math.min(PANEL_MAX, Math.max(PANEL_MIN, width * 0.33)));
  return { wide, heights, large, panelWidth };
}

function project(velocity: number) {
  'worklet';
  // Where a flick would come to rest (Apple's deceleration curve).
  return ((velocity / 1000) * 0.998) / (1 - 0.998);
}

/**
 * Apple Maps' persistent sheet: always on screen, resting at peek / medium /
 * large, with the map fully interactive behind it. On wide screens it turns
 * into a floating side panel.
 */
export function MapsSheet({
  detent,
  onDetentChange,
  header,
  children,
}: {
  detent: Detent;
  onDetentChange: (d: Detent) => void;
  header: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useMapsTheme();
  const insets = useSafeAreaInsets();
  const { wide, heights, large, panelWidth } = useSheetMetrics();

  const offsetFor = (d: Detent) => large - heights[d];
  const translateY = useSharedValue(offsetFor(detent));
  const start = useSharedValue(0);

  // A drag already springs to its detent; don't restart that animation.
  const settledByDrag = useRef<Detent | null>(null);
  const target = offsetFor(detent);
  useEffect(() => {
    if (settledByDrag.current === detent) {
      settledByDrag.current = null;
      return;
    }
    translateY.set(withSpring(target, { duration: 450, dampingRatio: 0.85 }));
    // Only the resting offset matters; `detent` is read for the drag check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, translateY]);

  const settle = (d: Detent) => {
    settledByDrag.current = d === detent ? null : d;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onDetentChange(d);
  };

  const peekOffset = offsetFor('peek');
  const mediumOffset = offsetFor('medium');

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onActivate: () => {
      'worklet';
      start.set(translateY.get());
    },
    onUpdate: (e) => {
      'worklet';
      const next = start.get() + e.translationY;
      // Resist dragging above the top or below peek.
      if (next < 0) translateY.set(next * 0.25);
      else if (next > peekOffset) translateY.set(peekOffset + (next - peekOffset) * 0.25);
      else translateY.set(next);
    },
    onDeactivate: (e) => {
      'worklet';
      const projected = translateY.get() + project(e.velocityY);
      const options: [Detent, number][] = [
        ['large', 0],
        ['medium', mediumOffset],
        ['peek', peekOffset],
      ];
      let best = options[0];
      for (const o of options) {
        if (Math.abs(o[1] - projected) < Math.abs(best[1] - projected)) best = o;
      }
      translateY.set(
        withSpring(best[1], { duration: 450, dampingRatio: 0.85, velocity: e.velocityY })
      );
      scheduleOnRN(settle, best[0]);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  if (wide) {
    return (
      <Glass
        style={[
          styles.panel,
          { width: panelWidth, top: insets.top + 12, bottom: insets.bottom + 12 },
        ]}>
        <View style={styles.panelHeader}>
          <View style={[styles.grabber, { backgroundColor: colors.tertiaryLabel }]} />
          {header}
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Glass>
    );
  }

  // At medium/peek the lower part of the sheet is off-screen; pad the scroll
  // content so everything can still be reached.
  const hidden = large - heights[detent];

  return (
    // A static wrapper sizes the sheet; only the inner view's transform animates.
    <View style={[styles.sheetWrap, { height: large }]} pointerEvents="box-none">
      <Animated.View style={[styles.sheetBody, animatedStyle]}>
        <Glass style={styles.sheet}>
          <GestureDetector gesture={pan}>
            <View style={styles.dragArea}>
              <View style={[styles.grabber, { backgroundColor: colors.tertiaryLabel }]} />
              {header}
            </View>
          </GestureDetector>
          <ScrollView
            style={styles.flex}
            scrollEnabled={detent !== 'peek'}
            contentContainerStyle={[styles.content, { paddingBottom: hidden + insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {children}
          </ScrollView>
        </Glass>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheetWrap: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    bottom: 0,
  },
  sheetBody: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    boxShadow: '0 -2px 16px rgba(0,0,0,0.14)',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  dragArea: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 9,
  },
  panel: {
    position: 'absolute',
    left: 12,
    borderRadius: 34,
    borderCurve: 'continuous',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  panelHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  content: {
    paddingHorizontal: 16,
  },
});
