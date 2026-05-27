export interface Site {
  id: string;
  name: string;
  places: number; // count of places (mock for now)
}

/* The existing site picker uses these — extracted so the create + configure
   flows can share the same list. */
export const SITES: Site[] = [
  { id: 'HQ-MAIN',      name: 'HQ-MAIN',      places: 12 },
  { id: 'HQ-LAB',       name: 'HQ-LAB',       places: 4 },
  { id: 'WAREHOUSE-A',  name: 'WAREHOUSE-A',  places: 6 },
  { id: 'WAREHOUSE-B',  name: 'WAREHOUSE-B',  places: 8 },
  { id: 'RETAIL-PA',    name: 'RETAIL-PA',    places: 2 },
  { id: 'RETAIL-MV',    name: 'RETAIL-MV',    places: 2 },
];
