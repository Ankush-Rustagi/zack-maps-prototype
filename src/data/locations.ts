export interface FloorLayout {
  /** Data URL or remote URL of the floorplan image. */
  imageUrl: string;
  /** Original filename (display only). */
  filename?: string;
  /** Four corners in clockwise-from-top-left order, each [lng, lat]. */
  corners: [[number, number], [number, number], [number, number], [number, number]];
  /** 0.1–1.0 — controls raster-opacity in V. */
  opacity: number;
  /** Optional polygon mask in lng/lat. Clips the image to this shape when rendered. */
  crop?: GeoJSON.Polygon | null;
}

export interface LocationFloor {
  id: string;
  name: string;
  layout?: FloorLayout | null;
}

export type SetupStatus = 'pending' | 'configured';

export interface Location {
  id: string;
  name: string;
  lng: number;
  lat: number;
  deviceCount: number;
  onlineCount: number; // ≤ deviceCount
  /** Sites this location belongs to. A location can span multiple sites
      (e.g. a building shared by HQ-MAIN and HQ-LAB). Empty array = none. */
  siteIds: string[];
  address?: string;
  floors: LocationFloor[];
  /** 'pending' = just dropped, no perimeter/layout/devices yet. */
  setupStatus: SetupStatus;
  /** Outer property line / building outline (lng/lat polygon). Shared across floors. */
  perimeter?: GeoJSON.Polygon | null;
}

/**
 * Build a 100m × 100m default-positioned corner box around a lat/lng.
 * Order: clockwise from top-left. Accounts for latitude-dependent lng scaling.
 */
export function defaultLayoutCorners(lng: number, lat: number, halfMeters = 50): FloorLayout['corners'] {
  const dLat = halfMeters / 111000;
  const dLng = halfMeters / (111000 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - dLng, lat + dLat], // top-left
    [lng + dLng, lat + dLat], // top-right
    [lng + dLng, lat - dLat], // bottom-right
    [lng - dLng, lat - dLat], // bottom-left
  ];
}

/* Mock Bay Area locations — varied enough that clustering triggers between
   zoom 9 and 13. Online/offline counts seeded for realistic donut rings. */
export const LOCATIONS: Location[] = [
  {
    id: 'hq-campus',
    name: 'HQ Campus',
    lng: -122.3255, lat: 37.5630,
    deviceCount: 47, onlineCount: 44,
    siteIds: ['HQ-MAIN'],
    address: '405 E 4th Ave, San Mateo, CA',
    floors: [
      { id: 'f1', name: 'Floor 1' },
      { id: 'f2', name: 'Floor 2' },
      { id: 'f3', name: 'Floor 3' },
      { id: 'roof', name: 'Roof' },
    ],
    setupStatus: 'configured',
  },
  {
    id: 'hq-lab',
    name: 'HQ Lab',
    lng: -122.3201, lat: 37.5588,
    deviceCount: 18, onlineCount: 17,
    siteIds: ['HQ-LAB'],
    address: '180 Concourse Dr, San Mateo, CA',
    floors: [{ id: 'g', name: 'Ground' }],
    setupStatus: 'configured',
  },
  {
    id: 'warehouse-a',
    name: 'Warehouse A',
    lng: -122.0808, lat: 37.6688,
    deviceCount: 32, onlineCount: 30,
    siteIds: ['WAREHOUSE-A'],
    address: '24501 Mission Blvd, Hayward, CA',
    floors: [
      { id: 'g', name: 'Ground' },
      { id: 'mezz', name: 'Mezzanine' },
    ],
    setupStatus: 'configured',
  },
  {
    id: 'warehouse-b',
    name: 'Warehouse B',
    lng: -122.2730, lat: 37.8044,
    deviceCount: 24, onlineCount: 19,
    siteIds: ['WAREHOUSE-B'],
    address: '1212 Broadway, Oakland, CA',
    floors: [{ id: 'g', name: 'Ground' }],
    setupStatus: 'configured',
  },
  {
    id: 'retail-pa',
    name: 'Retail · Palo Alto',
    lng: -122.1430, lat: 37.4419,
    deviceCount: 9, onlineCount: 9,
    siteIds: ['RETAIL-PA'],
    address: '855 El Camino Real, Palo Alto, CA',
    floors: [{ id: 'f1', name: 'Storefront' }],
    setupStatus: 'configured',
  },
  {
    id: 'retail-mv',
    name: 'Retail · Mountain View',
    lng: -122.0838, lat: 37.3861,
    deviceCount: 8, onlineCount: 6,
    siteIds: ['RETAIL-MV'],
    address: '600 Castro St, Mountain View, CA',
    floors: [
      { id: 'f1', name: 'Storefront' },
      { id: 'f2', name: 'Floor 2' },
    ],
    setupStatus: 'configured',
  },
];

/* Default view box covers the whole Bay Area at zoom ~9 so clusters trigger. */
export const OVERVIEW_VIEW = { lng: -122.18, lat: 37.6, zoom: 9 };
