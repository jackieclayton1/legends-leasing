import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';
import { CATEGORY_STYLE, landmarkById } from '@/data/campus';
import type { Apartment, Landmark } from '@/data/types';
import { distanceMeters, formatDistance, formatPrice } from '@/lib/geo';
import {
  activeFilterCount,
  NO_FILTERS,
  walkToQuad,
  type Filters,
  type SortKey,
} from '@/lib/filters';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';
import { PhotoTile, photoCaptions } from './photos';
import { Chip, Group, SectionTitle, Separator, Stars, Tap, text } from './ui';

const BED_STEPS: (number | null)[] = [null, 0, 1, 2, 3, 4];
const bedLabel = (b: number | null) =>
  b == null ? 'Any' : b === 0 ? 'Studio' : b >= 4 ? '4+' : `${b}`;
const PRICE_STEPS: (number | null)[] = [null, 750, 900, 1100];
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'distance', label: 'Closest' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
];

type Shortcut = {
  key: string;
  label: string;
  ios: SFSymbolName;
  md: MaterialSymbolName;
  color: string;
  onPress: () => void;
};

export function HomePanel({
  query,
  apartments,
  landmarks,
  filters,
  sort,
  saved,
  onFiltersChange,
  onSortChange,
  onSelectApartment,
  onSelectLandmark,
  onShowCampus,
}: {
  query: string;
  apartments: Apartment[];
  landmarks: Landmark[];
  filters: Filters;
  sort: SortKey;
  saved: string[];
  onFiltersChange: (f: Filters) => void;
  onSortChange: (s: SortKey) => void;
  onSelectApartment: (id: string) => void;
  onSelectLandmark: (id: string) => void;
  onShowCampus: () => void;
}) {
  const { colors } = useMapsTheme();
  const [showFilters, setShowFilters] = useState(false);
  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });
  const cycle = <T,>(steps: T[], value: T) => steps[(steps.indexOf(value) + 1) % steps.length];
  const filterCount = activeFilterCount(filters);
  const filterActive = showFilters || filterCount > 0;

  const shortcuts: Shortcut[] = [
    {
      key: 'campus',
      label: 'Campus',
      ios: 'graduationcap.fill',
      md: 'school',
      color: colors.crimson,
      onPress: onShowCampus,
    },
    {
      key: 'strip',
      label: 'The Strip',
      ios: 'fork.knife',
      md: 'restaurant',
      color: CATEGORY_STYLE.food.color,
      onPress: () => onSelectLandmark('the-strip'),
    },
    {
      key: 'stadium',
      label: 'Stadium',
      ios: 'sportscourt.fill',
      md: 'stadium',
      color: CATEGORY_STYLE.stadium.color,
      onPress: () => onSelectLandmark('bryant-denny'),
    },
    {
      key: 'saved',
      label: saved.length ? `Saved · ${saved.length}` : 'Saved',
      ios: 'heart.fill',
      md: 'favorite',
      color: '#FF2D55',
      onPress: () => set({ savedOnly: !filters.savedOnly }),
    },
  ];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chips}>
        <Tap
          onPress={() => setShowFilters((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          style={[
            styles.filterButton,
            { backgroundColor: filterActive ? colors.tint : colors.card },
          ]}>
          <Icon
            ios="line.3.horizontal.decrease"
            md="filter_list"
            size={20}
            color={filterActive ? '#fff' : colors.label}
            weight="semibold"
          />
        </Tap>
        <Chip
          label="Top Rated"
          active={sort === 'rating'}
          onPress={() => onSortChange(sort === 'rating' ? 'distance' : 'rating')}
        />
        <Chip
          label="Lowest Price"
          active={sort === 'price'}
          onPress={() => onSortChange(sort === 'price' ? 'distance' : 'price')}
        />
        <Chip
          label={filters.beds == null ? 'All Beds' : `${bedLabel(filters.beds)} Bed`}
          active={filters.beds != null}
          menu
          onPress={() => set({ beds: cycle(BED_STEPS, filters.beds) })}
        />
        <Chip
          label="Walk to Class"
          active={filters.walkable}
          onPress={() => set({ walkable: !filters.walkable })}
        />
        <Chip label="Pets OK" active={filters.pets} onPress={() => set({ pets: !filters.pets })} />
        <Chip
          label="Shuttle"
          active={filters.shuttle}
          onPress={() => set({ shuttle: !filters.shuttle })}
        />
        <Chip
          label="Furnished"
          active={filters.furnished}
          onPress={() => set({ furnished: !filters.furnished })}
        />
      </ScrollView>

      {showFilters && (
        <Group style={styles.filterPanel}>
          <Segmented
            title="Sort By"
            options={SORTS}
            value={sort}
            onChange={(k) => onSortChange(k as SortKey)}
          />
          <Segmented
            title="Bedrooms"
            options={BED_STEPS.map((b) => ({ key: String(b), label: bedLabel(b) }))}
            value={String(filters.beds)}
            onChange={(k) => set({ beds: k === 'null' ? null : Number(k) })}
          />
          <Segmented
            title="Max Rent"
            options={PRICE_STEPS.map((p) => ({
              key: String(p),
              label: p == null ? 'Any' : formatPrice(p),
            }))}
            value={String(filters.maxPrice)}
            onChange={(k) => set({ maxPrice: k === 'null' ? null : Number(k) })}
          />
          {filterCount > 0 && (
            <Tap onPress={() => onFiltersChange(NO_FILTERS)} style={styles.reset}>
              <Text style={[text.body, { color: colors.tint, fontWeight: '600' }]}>
                Reset {filterCount} {filterCount === 1 ? 'Filter' : 'Filters'}
              </Text>
            </Tap>
          )}
        </Group>
      )}

      {!query && !showFilters && (
        <Group style={styles.shortcuts}>
          {shortcuts.map((s) => (
            <Tap key={s.key} onPress={s.onPress} style={styles.shortcut} accessibilityRole="button">
              <View style={[styles.shortcutIcon, { backgroundColor: s.color }]}>
                <Icon ios={s.ios} md={s.md} size={22} color="#fff" />
              </View>
              <Text numberOfLines={1} style={[text.footnote, { color: colors.label }]}>
                {s.label}
              </Text>
            </Tap>
          ))}
        </Group>
      )}

      {landmarks.length > 0 && (
        <>
          <SectionTitle>Places</SectionTitle>
          <Group>
            {landmarks.map((l, i) => {
              const cat = CATEGORY_STYLE[l.category];
              return (
                <View key={l.id}>
                  {i > 0 && <Separator inset={60} />}
                  <Tap onPress={() => onSelectLandmark(l.id)} style={styles.row}>
                    <View style={[styles.rowIcon, { backgroundColor: cat.color }]}>
                      <Icon ios={cat.ios} md={cat.md} size={17} color="#fff" />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={[text.headline, { color: colors.label }]}>{l.name}</Text>
                      <Text style={[text.footnote, { color: colors.secondaryLabel }]}>
                        {cat.label}
                      </Text>
                    </View>
                  </Tap>
                </View>
              );
            })}
          </Group>
        </>
      )}

      <SectionTitle
        trailing={
          <Text style={[text.footnote, { color: colors.secondaryLabel }]}>
            {apartments.length} {apartments.length === 1 ? 'result' : 'results'}
          </Text>
        }>
        Off-Campus Apartments
      </SectionTitle>

      {apartments.length === 0 ? (
        <Group style={styles.empty}>
          <Icon ios="house.slash" md="home" size={28} color={colors.secondaryLabel} />
          <Text style={[text.headline, { color: colors.label }]}>No Matches</Text>
          <Text style={[text.footnote, { color: colors.secondaryLabel, textAlign: 'center' }]}>
            Try a different search or loosen your filters.
          </Text>
          {filterCount > 0 && (
            <Tap onPress={() => onFiltersChange(NO_FILTERS)}>
              <Text style={[text.body, { color: colors.tint, fontWeight: '600' }]}>
                Clear Filters
              </Text>
            </Tap>
          )}
        </Group>
      ) : (
        <View style={styles.cards}>
          {apartments.map((a) => (
            <ApartmentCard
              key={a.id}
              apartment={a}
              saved={saved.includes(a.id)}
              onPress={() => onSelectApartment(a.id)}
            />
          ))}
        </View>
      )}

      <Text style={[text.footnote, styles.disclaimer, { color: colors.secondaryLabel }]}>
        Listings are sample data. Distances are to the Quad.
      </Text>
    </View>
  );
}

function Segmented({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { colors } = useMapsTheme();
  return (
    <View style={styles.segmentedBlock}>
      <Text style={[text.caption, { color: colors.secondaryLabel }]}>{title.toUpperCase()}</Text>
      <View style={[styles.segmented, { backgroundColor: colors.fill }]}>
        {options.map((o) => {
          const active = o.key === value;
          return (
            <Tap
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && { backgroundColor: colors.sheetSolid }]}>
              <Text
                numberOfLines={1}
                style={[
                  text.footnote,
                  { color: colors.label, fontWeight: active ? '600' : '500' },
                ]}>
                {o.label}
              </Text>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const priceTier = (a: Apartment) => (a.priceMin < 800 ? '$' : a.priceMin < 1100 ? '$$' : '$$$');

/** Search-result card in the style of Apple Maps: details, then a photo strip. */
export function ApartmentCard({
  apartment: a,
  saved,
  onPress,
}: {
  apartment: Apartment;
  saved: boolean;
  onPress: () => void;
}) {
  const { colors } = useMapsTheme();
  const miles = formatDistance(distanceMeters(a, landmarkById.quad));
  const availabilityColor = /now/i.test(a.availability)
    ? colors.green
    : /left|waitlist/i.test(a.availability)
      ? colors.orange
      : colors.secondaryLabel;
  const unit = a.leaseType === 'By the bed' ? '/bed' : '/mo';

  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardTitleRow}>
        <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.label }]}>
          {a.name}
        </Text>
        {saved && <Icon ios="heart.fill" md="favorite" size={15} color="#FF2D55" />}
      </View>
      <Text style={[text.body, { color: colors.secondaryLabel }]}>
        Apartments · {miles} · {priceTier(a)}
      </Text>
      <Text style={[text.body, { color: availabilityColor }]}>
        {a.availability}
        <Text style={{ color: colors.secondaryLabel }}>
          {` · From ${formatPrice(a.priceMin)}${unit}`}
        </Text>
      </Text>
      <View style={styles.cardMeta}>
        <Stars rating={a.rating} size={13} />
        <Text style={[text.footnote, { color: colors.secondaryLabel }]}>({a.reviews})</Text>
        <Icon ios="mappin.and.ellipse" md="location_on" size={13} color={colors.secondaryLabel} />
        <Text style={[text.footnote, { color: colors.secondaryLabel }]}>
          Neighborhood <Text style={{ color: colors.tint }}>{a.neighborhood}</Text>
        </Text>
      </View>
      <View style={styles.photoRow}>
        {photoCaptions(a)
          .slice(0, 3)
          .map((caption, i) => (
            <PhotoTile
              key={caption}
              apartment={a}
              caption={caption}
              index={i}
              style={styles.photo}
            />
          ))}
      </View>
    </Tap>
  );
}

/** Compact list row, used for "Apartments Nearby" on a place card. */
export function ApartmentRow({
  apartment: a,
  saved,
  onPress,
  detail,
}: {
  apartment: Apartment;
  saved?: boolean;
  onPress: () => void;
  detail?: string;
}) {
  const { colors } = useMapsTheme();
  const minutes = Math.round(walkToQuad(a));
  const unit = a.leaseType === 'By the bed' ? '/bed' : '/mo';
  return (
    <Tap onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={[styles.rowIcon, { backgroundColor: colors.crimson }]}>
        <Icon ios="house.fill" md="home" size={17} color="#fff" />
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowTitle}>
          <Text
            numberOfLines={1}
            style={[text.headline, styles.flexShrink, { color: colors.label }]}>
            {a.name}
          </Text>
          {saved && <Icon ios="heart.fill" md="favorite" size={13} color="#FF2D55" />}
        </View>
        <Text numberOfLines={1} style={[text.footnote, { color: colors.secondaryLabel }]}>
          {detail ?? `${a.neighborhood} · ${minutes} min walk`}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={[text.footnote, { color: colors.label, fontWeight: '600', flexShrink: 0 }]}>
            From {formatPrice(a.priceMin)}
            <Text style={{ color: colors.secondaryLabel, fontWeight: '400' }}>{unit}</Text>
          </Text>
          <Stars rating={a.rating} />
        </View>
      </View>
      <Icon
        ios="chevron.right"
        md="chevron_right"
        size={13}
        color={colors.tertiaryLabel}
        weight="bold"
      />
    </Tap>
  );
}

const styles = StyleSheet.create({
  chipScroll: { marginHorizontal: -16 },
  chips: { gap: 8, paddingHorizontal: 16, paddingBottom: 2 },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanel: { marginTop: 12, padding: 14, gap: 14 },
  segmentedBlock: { gap: 6 },
  segmented: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segment: {
    flex: 1,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  reset: { alignSelf: 'center' },
  shortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 14,
  },
  shortcut: { alignItems: 'center', gap: 6, width: 78 },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cards: { gap: 12 },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 16,
    gap: 3,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 20, lineHeight: 25, fontWeight: '600', flexShrink: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  photoRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  photo: { flex: 1, aspectRatio: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  flexShrink: { flexShrink: 1 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 20 },
  disclaimer: { textAlign: 'center', marginTop: 16 },
});
