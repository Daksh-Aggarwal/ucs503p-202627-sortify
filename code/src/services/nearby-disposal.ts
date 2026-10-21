import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { WasteItem } from '@/data/catalog';

export type DisposalKind = 'battery' | 'electronics' | 'medicine' | 'medical';
export type NearbyPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  address: string;
};

// A broad hazardous category alone does not establish what a facility accepts.
export function disposalKind(item: WasteItem): DisposalKind | null {
  if (item.id === 'battery') return 'battery';
  if (item.category === 'E-waste') return 'electronics';
  if (item.id === 'medicine') return 'medicine';
  if (item.id === 'medical-waste') return 'medical';
  return null;
}

export async function requestLocationPermission() {
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

export async function currentLocation() {
  let permission: Location.LocationPermissionResponse;
  try {
    permission = await Location.getForegroundPermissionsAsync();
  } catch (error) {
    if (__DEV__) console.log('[Sortify] Location permission check failed:', error);
    throw new Error(
      'Could not check location permission. Check your browser or device settings and try again.',
    );
  }
  if (!permission.granted)
    throw new Error('Location permission is off. Enable it in your device settings and try again.');
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      ...(Platform.OS === 'web' ? { maximumAge: 0, timeout: 15000 } : {}),
    });
    return position.coords;
  } catch (error) {
    if (__DEV__) console.log('[Sortify] Device location request failed:', error);
    throw new Error(
      'Could not determine your device location. Check that location services are enabled and try again.',
    );
  }
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radians = (n: number) => (n * Math.PI) / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
export async function findNearby(
  kind: DisposalKind,
  coords: { latitude: number; longitude: number },
): Promise<NearbyPlace[]> {
  const around = `around:25000,${coords.latitude},${coords.longitude}`;
  // Medical facilities and pharmacies are contacts for advice, not assumed drop-off points.
  const filter =
    kind === 'battery'
      ? '["recycling:batteries"="yes"]'
      : kind === 'electronics'
        ? '["recycling:electrical_items"="yes"]'
        : kind === 'medicine'
          ? '["amenity"="pharmacy"]'
          : '["amenity"~"^(hospital|clinic|doctors)$"]';
  const query = `[out:json][timeout:10];(nwr(${around})${filter};${kind === 'electronics' ? `nwr(${around})["recycling:electronics"="yes"];` : ''});out center tags;`;
  // Independent public mirrors provide a fallback when one endpoint is unavailable.
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];
  let elements: OsmElement[] | undefined;
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!response.ok) {
        if (__DEV__) {
          // Overpass error pages can include the submitted query, including coordinates.
          const body = await response.text().catch(() => '');
          const redacted = body
            .replaceAll(String(coords.latitude), '[latitude]')
            .replaceAll(String(coords.longitude), '[longitude]')
            .slice(0, 1000);
          console.log(
            '[Sortify] Nearby search HTTP error:',
            endpoint,
            response.status,
            response.statusText,
            redacted,
          );
        }
        continue;
      }
      const data = (await response.json()) as { elements?: OsmElement[]; remark?: string };
      if (!Array.isArray(data.elements) || data.remark) {
        if (__DEV__)
          console.log(
            '[Sortify] Nearby search invalid or incomplete response:',
            endpoint,
            data.remark || 'Missing elements array',
          );
        continue;
      }
      elements = data.elements;
      break;
    } catch (error) {
      if (__DEV__)
        console.log(
          '[Sortify] Nearby search request failed:',
          endpoint,
          controller.signal.aborted ? 'Timed out after 12 seconds' : error,
        );
      // Try the next endpoint on network errors, timeouts, and invalid responses.
    } finally {
      clearTimeout(timer);
    }
  }
  if (!elements)
    throw new Error(
      'Nearby map services are unavailable. Try again later or search in Maps below.',
    );
  return elements
    .flatMap((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
      const tags = element.tags || {};
      const address = [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ');
      return [
        {
          id: `${element.type}/${element.id}`,
          name:
            tags.name ||
            (kind === 'medicine'
              ? 'Pharmacy'
              : kind === 'medical'
                ? 'Healthcare facility'
                : 'Recycling collection point'),
          latitude,
          longitude,
          distance: distanceKm(coords, { latitude, longitude }),
          address,
        },
      ];
    })
    .filter((place) => place.distance <= 25)
    .sort((a, b) => a.distance - b.distance);
}
