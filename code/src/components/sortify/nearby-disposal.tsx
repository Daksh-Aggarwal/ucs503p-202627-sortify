import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { WasteItem } from '@/data/catalog';
import { currentLocation, disposalKind, findNearby, NearbyPlace } from '@/services/nearby-disposal';
import { useApp } from '@/state/app-state';
import { Button, C, Card, Row, Txt } from './ui';

export function NearbyDisposal({ item }: { item: WasteItem }) {
  const { state, refreshLocation } = useApp();
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [radius, setRadius] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const kind = disposalKind(item);
  if (!kind) return null;
  async function search() {
    if (!kind) return;
    setBusy(true);
    setError('');
    setPlaces(null);
    try {
      const coords = await currentLocation();
      void refreshLocation(coords);
      setPlaces(await findNearby(kind, coords));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not find nearby options. Check your location and connection, then try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  const visible = places?.filter((place) => place.distance <= radius).slice(0, 10);
  const isAdvice = kind === 'medicine' || kind === 'medical';
  const mapSearch =
    kind === 'battery'
      ? 'household battery recycling near me'
      : kind === 'electronics'
        ? 'electronics recycling near me'
        : kind === 'medicine'
          ? 'pharmacy near me'
          : 'healthcare facility near me';
  return (
    <Card style={{ gap: 12, marginTop: 16 }}>
      <Txt size={17} weight="600">
        Nearby {isAdvice ? 'places to ask' : 'collection options'}
      </Txt>
      <Txt size={12} color={C.muted}>
        {isAdvice
          ? 'Contact a nearby healthcare provider or pharmacist for guidance; these places are not confirmed disposal sites.'
          : 'Mapped collection points may accept this material. Confirm the item, authorization and opening hours before visiting.'}
      </Txt>
      {!state.nearbyDisposalEnabled ? (
        <Button
          title="Enable nearby options in profile"
          variant="secondary"
          onPress={() => router.push('/profile')}
        />
      ) : (
        <>
          <Txt size={12} color={C.muted}>
            Search uses your current device location.
          </Txt>
          <Button
            title={
              busy ? 'Finding nearby options…' : places ? 'Search again' : 'Find nearby options'
            }
            disabled={busy}
            onPress={search}
          />
          {!!error && (
            <Txt accessibilityRole="alert" size={12} color="#AE5B41">
              {error}
            </Txt>
          )}
          {(!!error || (places && !visible?.length)) && (
            <>
              <Txt size={12} color={C.muted}>
                You can also search in Google Maps. Results are not verified; call ahead to confirm
                whether they accept this item.
              </Txt>
              <Button
                title="Search in Google Maps"
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearch)}`,
                  ).catch(() =>
                    setError(
                      'Could not open Maps. Search for a local collection service or use the disposal steps above.',
                    ),
                  );
                }}
              />
            </>
          )}
          {places && (
            <>
              <Txt size={12} color={C.muted}>
                Within straight-line distance:
              </Txt>
              <Row style={{ flexWrap: 'wrap' }}>
                {[5, 10, 25].map((km) => (
                  <Button
                    key={km}
                    title={`${km} km`}
                    variant={radius === km ? 'primary' : 'secondary'}
                    onPress={() => setRadius(km)}
                  />
                ))}
              </Row>
              {visible?.length ? (
                visible.map((place) => (
                  <View
                    key={place.id}
                    style={{ gap: 4, borderTopWidth: 1, borderColor: C.line, paddingTop: 10 }}
                  >
                    <Txt weight="600">{place.name}</Txt>
                    <Txt size={12} color={C.muted}>
                      {place.distance.toFixed(1)} km away
                      {place.address ? ` · ${place.address}` : ''}
                    </Txt>
                    <Button
                      title="View on map"
                      variant="ghost"
                      onPress={() => {
                        void Linking.openURL(
                          `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=17/${place.latitude}/${place.longitude}`,
                        );
                      }}
                    />
                  </View>
                ))
              ) : (
                <Txt size={12} color={C.muted}>
                  No mapped options within {radius} km. Try a larger distance or use the disposal
                  steps above.
                </Txt>
              )}
              <Txt size={11} color={C.muted}>
                Map data © OpenStreetMap contributors. Results may be incomplete or out of date.
              </Txt>
            </>
          )}
        </>
      )}
    </Card>
  );
}
