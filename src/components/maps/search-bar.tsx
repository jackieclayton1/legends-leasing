import { useRef } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';

import { Icon } from './icon';
import { Tap } from './ui';

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  focused,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onCancel: () => void;
  focused: boolean;
}) {
  const { colors } = useMapsTheme();
  const input = useRef<TextInputInstance>(null);

  return (
    <View style={styles.row}>
      <View style={[styles.field, { backgroundColor: colors.card }]}>
        <Icon
          ios="magnifyingglass"
          md="search"
          size={17}
          color={colors.secondaryLabel}
          weight="medium"
        />
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="Search apartments & places"
          placeholderTextColor={colors.secondaryLabel}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
          style={[
            styles.input,
            { color: colors.label },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
          ]}
        />
        {value.length > 0 && (
          <Tap onPress={() => onChangeText('')} accessibilityLabel="Clear search">
            <Icon ios="xmark.circle.fill" md="cancel" size={20} color={colors.label} />
          </Tap>
        )}
      </View>
      {(focused || value.length > 0) && (
        <Tap
          onPress={() => {
            input.current?.blur();
            onCancel();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close search"
          style={[styles.close, { backgroundColor: colors.card }]}>
          <Icon ios="xmark" md="close" size={20} color={colors.label} weight="semibold" />
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 18, height: 46, paddingVertical: 0 },
  close: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
