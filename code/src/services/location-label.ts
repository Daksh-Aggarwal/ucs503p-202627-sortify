import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type Coordinates = { latitude: number; longitude: number };

// Expo's reverse geocoder is native-only. On web use OpenStreetMap's Nominatim.
export async function locationLabel(coords: Coordinates): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          zoom: '10',
          lat: String(coords.latitude),
          lon: String(coords.longitude),
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Geocoding unavailable');
        const data = (await response.json()) as { address?: Record<string, string> };
        const address = data.address || {};
        const city =
          address.city || address.town || address.village || address.municipality || address.county;
        return (
          [city, address.state || address.country]
            .filter((part, i, parts) => part && parts.indexOf(part) === i)
            .join(', ') || 'Location detected'
        );
      } finally {
        clearTimeout(timer);
      }
    }
    const [address] = await Location.reverseGeocodeAsync(coords);
    if (!address) return 'Location detected';
    const city = address.city || address.district || address.subregion;
    return (
      [city, address.region || address.country]
        .filter((part, i, parts) => part && parts.indexOf(part) === i)
        .join(', ') || 'Location detected'
    );
  } catch {
    return 'Location detected';
  }
}
