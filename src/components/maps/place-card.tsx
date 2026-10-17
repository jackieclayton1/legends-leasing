import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useMapsTheme } from '@/constants/maps-theme';
import { COMMUTE_DESTINATIONS, landmarkById } from '@/data/campus';
import type { Apartment, TravelMode } from '@/data/types';
import { estimateTrip, formatDistance, formatDuration, formatPrice } from '@/lib/geo';

import { Icon, type MaterialSymbolName, type SFSymbolName } from './icon';
import { amenityIcon, PhotoTile, photoCaptions } from './photos';
import { Chip, CircleButton, Group, SectionTitle, Separator, Stars, Tap, text } from './ui';

type Glyph = { ios: SFSymbolName; md: MaterialSymbolName };

const MODE_GLYPH: Record<TravelMode, Glyph> = {
  walk: { ios: 'figure.walk', md: 'directions_walk' },
  bike: { ios: 'bicycle', md: 'directions_bike' },
  drive: { ios: 'car.fill', md: 'directions_car' },
};

export function PlaceCard({
  apartment: a,
  saved,
  destinationId,
  onDestinationChange,
  onToggleSaved,
  onDirections,
  onClose,
}: {
  apartment: Apartment;
  saved: boolean;
  destinationId: string;
  onDestinationChange: (id: string) => void;
  onToggleSaved: () => void;
  onDirections: (mode: TravelMode) => void;
  onClose: () => void;
}) {
  const { colors } = useMapsTheme();
  const destination = landmarkById[destinationId];
  const unit = a.leaseType === 'By the bed' ? 'per bed' : 'per month';
  const walk = estimateTrip(a, destination, 'walk');
  const photos = photoCaptions(a);

  const share = () =>
    Share.share({
      message: `${a.name} — ${a.address}, Tuscaloosa, AL. From ${formatPrice(a.priceMin)} ${unit}.`,
    });

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[text.largeTitle, { color: colors.label }]}>{a.name}</Text>
          <Text style={[text.subhead, { color: colors.secondaryLabel }]}>
            Apartment Complex · {a.neighborhood}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <CircleButton ios="square.and.arrow.up" md="ios_share" label="Share" onPress={share} />
          <CircleButton ios="xmark" md="close" label="Close" onPress={onClose} />
        </View>
      </View>

      <View style={styles.actions}>
        <Tap
          onPress={() => onDirections('walk')}
          style={[styles.primaryAction, { backgroundColor: colors.tint }]}
          accessibilityRole="button">
          <Icon ios="figure.walk" md="directions_walk" size={18} color="#fff" weight="semibold" />
          <Text style={styles.primaryText}>{formatDuration(walk.seconds)}</Text>
        </Tap>
        <ActionButton
          label="Call"
          glyph={{ ios: 'phone.fill', md: 'call' }}
          onPress={() => Linking.openURL(`tel:${a.phone.replace(/\D/g, '')}`)}
        />
        <ActionButton
          label={saved ? 'Saved' : 'Save'}
          glyph={saved ? { ios: 'heart.fill', md: 'favorite' } : { ios: 'heart', md: 'favorite' }}
          tint={saved ? '#FF2D55' : undefined}
          onPress={onToggleSaved}
        />
        <ActionButton
          label="Tour"
          glyph={{ ios: 'calendar', md: 'calendar_month' }}
          onPress={() =>
            Linking.openURL(
              `sms:${a.phone.replace(/\D/g, '')}&body=${encodeURIComponent(
                `Hi! I'd like to schedule a tour of ${a.name}.`
              )}`
            )
          }
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.stats}>
        <Stat label="PRICE" value={`${formatPrice(a.priceMin)}+`} sub={unit} />
        <StatDivider />
        <Stat
          label={`${a.reviews} RATINGS`}
          value={<Stars rating={a.rating} size={16} />}
          sub="Resident reviews"
        />
        <StatDivider />
        <Stat
          label="TO THE QUAD"
          value={formatDuration(estimateTrip(a, landmarkById.quad, 'walk').seconds)}
          sub="walking"
        />
        <StatDivider />
        <Stat label="LEASE" value={a.leaseType.replace('By the ', 'Per ')} sub={a.availability} />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.photos}>
        {photos.map((caption, i) => (
          <PhotoTile
            key={caption}
            apartment={a}
            caption={caption}
            index={i}
            showCaption
            style={[styles.photo, i === 0 && styles.photoHero]}
          />
        ))}
      </ScrollView>

      <SectionTitle>About</SectionTitle>
      <Group style={styles.padded}>
        <Text style={[text.body, { color: colors.label }]}>{a.description}</Text>
      </Group>

      <SectionTitle
        trailing={
          <Text style={[text.footnote, { color: colors.secondaryLabel }]}>{a.availability}</Text>
        }>
        Floor Plans
      </SectionTitle>
      <Group>
        {a.plans.map((p, i) => (
          <View key={p.name}>
            {i > 0 && <Separator />}
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={[text.headline, { color: colors.label }]}>{p.name}</Text>
                <Text style={[text.footnote, { color: colors.secondaryLabel }]}>
                  {p.beds === 0 ? 'Studio' : `${p.beds} bd`} · {p.baths} ba ·{' '}
                  {p.sqft.toLocaleString('en-US')} sq ft
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[text.headline, { color: colors.label }]}>{formatPrice(p.price)}</Text>
                <Text style={[text.footnote, { color: colors.secondaryLabel }]}>{unit}</Text>
              </View>
            </View>
          </View>
        ))}
      </Group>

      <SectionTitle>Commute</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.chips}>
        {COMMUTE_DESTINATIONS.map((id) => (
          <Chip
            key={id}
            label={landmarkById[id].name}
            active={id === destinationId}
            onPress={() => onDestinationChange(id)}
          />
        ))}
      </ScrollView>
      <Group style={{ marginTop: 10 }}>
        {(['walk', 'bike', 'drive'] as const).map((mode, i) => {
          const trip = estimateTrip(a, destination, mode);
          return (
            <View key={mode}>
              {i > 0 && <Separator inset={52} />}
              <Tap onPress={() => onDirections(mode)} style={styles.commuteRow}>
                <Icon
                  ios={MODE_GLYPH[mode].ios}
                  md={MODE_GLYPH[mode].md}
                  size={20}
                  color={colors.tint}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[text.headline, { color: colors.label }]}>
                    {formatDuration(trip.seconds)}
                  </Text>
                  <Text style={[text.footnote, { color: colors.secondaryLabel }]}>
                    {formatDistance(trip.meters)} to {destination.name}
                  </Text>
                </View>
                <Text style={[text.subhead, { color: colors.tint, fontWeight: '600' }]}>GO</Text>
              </Tap>
            </View>
          );
        })}
      </Group>

      <SectionTitle>Amenities</SectionTitle>
      <View style={styles.amenities}>
        {a.amenities.map((name) => {
          const glyph = amenityIcon(name);
          return (
            <View key={name} style={[styles.amenity, { backgroundColor: colors.card }]}>
              <Icon ios={glyph.ios} md={glyph.md} size={15} color={colors.crimson} />
              <Text style={[text.footnote, { color: colors.label }]}>{name}</Text>
            </View>
          );
        })}
      </View>

      <SectionTitle>Details</SectionTitle>
      <Group>
        <Detail label="Address" value={`${a.address}\nTuscaloosa, AL`} />
        <Separator />
        <Detail label="Phone" value={a.phone} tint />
        <Separator />
        <Detail label="Lease" value={`${a.leaseType} · 12-month`} />
        <Separator />
        <Detail label="Parking" value={a.parking} />
        <Separator />
        <Detail label="Pets" value={a.pets ? 'Allowed' : 'Not allowed'} />
        <Separator />
        <Detail label="Furnished" value={a.furnished ? 'Yes' : 'No'} />
        <Separator />
        <Detail label="Campus Shuttle" value={a.shuttle ? 'On the CrimsonRide route' : 'No'} />
        <Separator />
        <Detail label="Built" value={String(a.yearBuilt)} />
      </Group>

      <Text style={[text.footnote, styles.disclaimer, { color: colors.tertiaryLabel }]}>
        Sample listing — confirm pricing and availability with the property.
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  glyph,
  onPress,
  tint,
}: {
  label: string;
  glyph: Glyph;
  onPress: () => void;
  tint?: string;
}) {
  const { colors } = useMapsTheme();
  return (
    <Tap
      onPress={onPress}
      style={[styles.secondaryAction, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Icon ios={glyph.ios} md={glyph.md} size={17} color={tint ?? colors.tint} />
      <Text style={[styles.secondaryText, { color: tint ?? colors.tint }]}>{label}</Text>
    </Tap>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  const { colors } = useMapsTheme();
  return (
    <View style={styles.stat}>
      <Text style={[text.caption, { color: colors.secondaryLabel }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[text.headline, { color: colors.label }]}>{value}</Text>
      ) : (
        value
      )}
      <Text numberOfLines={1} style={[text.footnote, { color: colors.secondaryLabel }]}>
        {sub}
      </Text>
    </View>
  );
}

function StatDivider() {
  const { colors } = useMapsTheme();
  return <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />;
}

function Detail({ label, value, tint }: { label: string; value: string; tint?: boolean }) {
  const { colors } = useMapsTheme();
  return (
    <View style={styles.detail}>
      <Text style={[text.footnote, { color: colors.secondaryLabel }]}>{label}</Text>
      <Text style={[text.body, { color: tint ? colors.tint : colors.label }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  headerText: { flex: 1, gap: 2 },
  headerButtons: { flexDirection: 'row', gap: 8, paddingTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  primaryAction: {
    flex: 1.4,
    height: 56,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  secondaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  secondaryText: { fontSize: 13, fontWeight: '600' },
  bleed: { marginHorizontal: -16 },
  stats: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'stretch' },
  stat: { gap: 3, paddingRight: 16, minWidth: 90 },
  statDivider: { width: StyleSheet.hairlineWidth, marginRight: 16 },
  photos: { gap: 8, paddingHorizontal: 16 },
  photo: {
    width: 140,
    height: 180,
  },
  photoHero: { width: 240 },
  padded: { padding: 14 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  chips: { gap: 8, paddingHorizontal: 16 },
  commuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  detail: { paddingVertical: 10, paddingHorizontal: 16, gap: 2 },
  disclaimer: { textAlign: 'center', marginTop: 20 },
});
