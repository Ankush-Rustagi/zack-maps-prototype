/**
 * Mock "existing inventory" — buildings already configured in the user's
 * Verkada platform from other products (Access Control, Cameras, etc).
 * When setting up a Maps location, the user can import these buildings'
 * floors (and optionally their existing devices) rather than building
 * everything from scratch.
 */

export interface InventoryFloor {
  id: string;
  name: string;
  /** Devices already plotted on this floor in the broader Verkada platform. */
  deviceCount: number;
}

export interface InventoryBuilding {
  id: string;
  name: string;
  /** Street address — used for the "Suggested" match in the picker. */
  address: string;
  floors: InventoryFloor[];
}

export const INVENTORY: InventoryBuilding[] = [
  {
    id: 'inv-hq-main',
    name: 'HQ Main Building',
    address: '405 E 4th Ave, San Mateo, CA',
    floors: [
      { id: 'f1', name: 'Floor 1', deviceCount: 12 },
      { id: 'f2', name: 'Floor 2', deviceCount: 8 },
      { id: 'f3', name: 'Floor 3', deviceCount: 14 },
      { id: 'roof', name: 'Roof', deviceCount: 0 },
    ],
  },
  {
    id: 'inv-hq-annex',
    name: 'HQ Annex',
    address: '405 E 4th Ave, San Mateo, CA',
    floors: [
      { id: 'g', name: 'Ground', deviceCount: 5 },
      { id: 'f2', name: 'Floor 2', deviceCount: 3 },
    ],
  },
  {
    id: 'inv-hq-lab',
    name: 'HQ Lab',
    address: '180 Concourse Dr, San Mateo, CA',
    floors: [{ id: 'g', name: 'Ground', deviceCount: 6 }],
  },
  {
    id: 'inv-warehouse-a',
    name: 'Hayward DC',
    address: '24501 Mission Blvd, Hayward, CA',
    floors: [
      { id: 'g', name: 'Ground', deviceCount: 30 },
      { id: 'mezz', name: 'Mezzanine', deviceCount: 0 },
    ],
  },
  {
    id: 'inv-boston',
    name: 'Boston Office',
    address: '50 Milk St, Boston, MA',
    floors: [{ id: 'f5', name: 'Floor 5', deviceCount: 8 }],
  },
  {
    id: 'inv-nyc',
    name: 'NYC Storefront',
    address: '350 5th Ave, New York, NY',
    floors: [{ id: 'f1', name: 'Floor 1', deviceCount: 12 }],
  },
  {
    id: 'inv-austin',
    name: 'Austin Lab',
    address: '500 W 2nd St, Austin, TX',
    floors: [
      { id: 'f1', name: 'Floor 1', deviceCount: 4 },
      { id: 'f2', name: 'Floor 2', deviceCount: 6 },
    ],
  },
];

/* Tokenize an address into normalized words for matching. Strips punctuation. */
function tokenize(addr: string): Set<string> {
  return new Set(
    addr
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2),
  );
}

/**
 * Return inventory buildings ranked by how well their address matches the
 * supplied location address. Top match returned first with a `score` >= 1
 * gets shown as "Suggested" in the UI.
 */
export function rankInventoryByAddress(
  locationAddress: string | undefined,
): { building: InventoryBuilding; score: number }[] {
  if (!locationAddress) return INVENTORY.map((b) => ({ building: b, score: 0 }));
  const target = tokenize(locationAddress);
  return INVENTORY
    .map((building) => {
      const tokens = tokenize(building.address);
      let score = 0;
      for (const t of tokens) if (target.has(t)) score++;
      return { building, score };
    })
    .sort((a, b) => b.score - a.score);
}
