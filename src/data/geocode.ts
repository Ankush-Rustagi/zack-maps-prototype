export interface GeocodeResult {
  id: string;
  name: string;
  fullAddress: string;
  placeType: string; // 'address' | 'poi' | 'place' | ...
  lng: number;
  lat: number;
}

interface MbxFeature {
  id: string;
  properties: {
    full_address?: string;
    name?: string;
    name_preferred?: string;
    feature_type?: string;
    place_formatted?: string;
  };
  geometry: { coordinates: [number, number] };
}

interface MbxResponse {
  features: MbxFeature[];
}

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

/**
 * Forward-geocode a free-text query via the Mapbox Geocoding API (v6).
 * Returns up to 6 results. AbortSignal is wired so stale lookups cancel
 * when the user keeps typing.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (!TOKEN || !query.trim()) return [];
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '6');
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('autocomplete', 'true');
  const resp = await fetch(url.toString(), { signal });
  if (!resp.ok) return [];
  const data = (await resp.json()) as MbxResponse;
  return data.features.map((f) => ({
    id: f.id,
    name: f.properties.name_preferred ?? f.properties.name ?? f.properties.full_address ?? '',
    fullAddress: f.properties.full_address ?? f.properties.place_formatted ?? '',
    placeType: f.properties.feature_type ?? 'place',
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}

/**
 * Reverse-geocode a coordinate pair → nearest address. Used for the
 * "Use my current location" affordance.
 */
export async function reverseGeocode(lng: number, lat: number, signal?: AbortSignal): Promise<GeocodeResult | null> {
  if (!TOKEN) return null;
  const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse');
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('limit', '1');
  url.searchParams.set('access_token', TOKEN);
  const resp = await fetch(url.toString(), { signal });
  if (!resp.ok) return null;
  const data = (await resp.json()) as MbxResponse;
  const f = data.features[0];
  if (!f) return null;
  return {
    id: f.id,
    name: f.properties.name_preferred ?? f.properties.name ?? f.properties.full_address ?? 'Current location',
    fullAddress: f.properties.full_address ?? f.properties.place_formatted ?? '',
    placeType: f.properties.feature_type ?? 'place',
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  };
}
