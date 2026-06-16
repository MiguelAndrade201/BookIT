type GeocodeResult = {
  lat: number;
  lng: number;
};

const cache = new Map<string, GeocodeResult | null>();

export async function geocodeAddress(address: string | null | undefined, fallback: string) {
  const query = address || fallback;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!query || !apiKey) return null;
  if (cache.has(query)) return cache.get(query) ?? null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!response.ok) {
      cache.set(query, null);
      return null;
    }

    const data = await response.json();
    const location = data.results?.[0]?.geometry?.location;
    const result = typeof location?.lat === 'number' && typeof location?.lng === 'number'
      ? { lat: location.lat, lng: location.lng }
      : null;

    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, null);
    return null;
  }
}
