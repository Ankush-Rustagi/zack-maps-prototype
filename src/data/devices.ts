export interface DeviceMarker {
  id: string;
  name: string;
  kind: 'camera' | 'door' | 'reader' | 'sensor';
  lng: number;
  lat: number;
  color?: string;
}

/* Mock devices clustered around a Bay Area site for the prototype map. */
export const DEVICES: DeviceMarker[] = [
  { id: 'door-lobby-n1', name: 'Door-Lobby-N1', kind: 'door',   lng: -122.3260, lat: 37.5635 },
  { id: 'cam-lobby-01',  name: 'Cam-Lobby-01',  kind: 'camera', lng: -122.3252, lat: 37.5629, color: '#4a7af7' },
  { id: 'cam-lobby-02',  name: 'Cam-Lobby-02',  kind: 'camera', lng: -122.3247, lat: 37.5632, color: '#94a3b8' },
  { id: 'cam-dock-04',   name: 'Cam-Dock-04',   kind: 'camera', lng: -122.3263, lat: 37.5624, color: '#4a7af7' },
];

export const MAP_CENTER = { lng: -122.3255, lat: 37.5630, zoom: 17 };

/* Per-location mock device list used by the configured Place card +
   the Editor's "place devices" picker. Real per-location data would
   come from the platform; for the prototype we render the same list
   for every location. */
export interface LocationDevice {
  name: string;
  kind: 'Camera' | 'Door' | 'Reader' | 'Sensor';
  online: boolean;
  placed: boolean;
}

export const MOCK_DEVICES_FOR_LOCATION: LocationDevice[] = [
  { name: 'Cam-Lobby-01',  kind: 'Camera', online: true,  placed: true  },
  { name: 'Cam-Lobby-02',  kind: 'Camera', online: true,  placed: true  },
  { name: 'Door-Lobby-N1', kind: 'Door',   online: true,  placed: true  },
  { name: 'Cam-Dock-04',   kind: 'Camera', online: true,  placed: false },
  { name: 'Reader-North',  kind: 'Reader', online: false, placed: false },
  { name: 'Motion-Lobby',  kind: 'Sensor', online: true,  placed: false },
];

export const KIND_ORDER: { kind: LocationDevice['kind']; plural: string; icon: string }[] = [
  { kind: 'Camera', plural: 'Cameras', icon: '◎' },
  { kind: 'Door',   plural: 'Doors',   icon: '▦' },
  { kind: 'Reader', plural: 'Readers', icon: '◐' },
  { kind: 'Sensor', plural: 'Sensors', icon: '◇' },
];
