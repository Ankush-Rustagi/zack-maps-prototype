import { create } from 'zustand';
import type { StateId } from './states';
import { FLYOUT_STATES } from './states';
import type { EventOrigin, EventData } from './data/events';
import { EVENT_DATA } from './data/events';
import { LOCATIONS } from './data/locations';
import type { Location, FloorLayout } from './data/locations';
import type { LocationDevice } from './data/devices';

export type Theme = 'dark' | 'light';
export type Basemap = 'street' | 'satellite' | 'none';
export type Dropdown = 'search' | 'site' | 'alerts' | null;
export type DevicePanelSide = 'right' | 'left';

interface Store {
  // Core state machine
  curState: StateId;
  goState: (id: StateId) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Bottom-left widgets
  layersOpen: boolean;
  toggleLayers: () => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Dropdowns in the top toolbar
  openDropdown: Dropdown;
  toggleDropdown: (which: Exclude<Dropdown, null>) => void;
  closeAllDropdowns: () => void;

  // Device panel (Q) selected device label
  deviceTitle: string;
  /** Kind of the currently-selected device — drives the device panel layout
   *  (cameras hide the door status/schedule sections and show detection
   *  events instead of unlock events). */
  deviceKind: LocationDevice['kind'];
  openDeviceMarker: (name: string, kind?: LocationDevice['kind'], fromLocationId?: string | null) => void;
  /** Close the device panel and return to the location detail (V) without
   *  collapsing the left flyout. */
  dismissDevicePanel: () => void;
  /** Location id to return to when user hits Back on the device panel. */
  deviceBackTo: string | null;

  // Event panel (R)
  currentEvent: EventData | null;
  eventBackTo: StateId | null;
  openEvent: (key: string, from: EventOrigin) => void;
  backFromEvent: () => void;
  /** Dismiss the alerts/event panel without collapsing the locations flyout. */
  dismissEventPanel: () => void;
  closeFlyout: () => void;

  // Layers options
  basemap: Basemap;
  setBasemap: (b: Basemap) => void;

  // Search query + map fly target
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  flyTarget: { lng: number; lat: number; zoom?: number; padding?: { top?: number; right?: number; bottom?: number; left?: number } } | null;
  flyTo: (t: { lng: number; lat: number; zoom?: number; padding?: { top?: number; right?: number; bottom?: number; left?: number } }) => void;
  /** Bounding box to fit (south-west + north-east corners). */
  fitBoundsTarget: { sw: [number, number]; ne: [number, number] } | null;
  fitBounds: (sw: [number, number], ne: [number, number]) => void;
  /** Compute bounds from current locations and trigger fit. */
  centerOnAllLocations: () => void;
  /** Imperative zoom request. The MapView watches this counter and calls zoomIn/Out. */
  zoomRequest: { dir: 'in' | 'out'; tick: number } | null;
  zoomIn: () => void;
  zoomOut: () => void;

  // Locations
  locations: Location[];
  selectedLocationId: string | null;
  selectLocation: (id: string) => void;
  selectedFloorId: string | null;
  setSelectedFloor: (id: string) => void;

  // Location creation popover
  createOpen: boolean;
  setCreateOpen: (b: boolean) => void;
  addLocation: (draft: { name: string; lng: number; lat: number; address?: string }) => string;
  /** Patch a location in place (rename, change site, add/rename/delete floors, etc.). */
  updateLocation: (id: string, patch: Partial<Location>) => void;
  /** Remove a location and clear selection if it was selected. */
  deleteLocation: (id: string) => void;
  /** Graduate a pending location to configured (seeds device counts to 0). */
  graduateLocation: (id: string, patch?: Partial<Location>) => void;
  /** Drop a floorplan image at the default corner box for the location pin. */
  setFloorLayout: (locationId: string, floorId: string, layout: FloorLayout) => void;
  /** Patch an existing floor's layout (corners, opacity, crop). */
  updateFloorLayout: (locationId: string, floorId: string, patch: Partial<FloorLayout>) => void;
  clearFloorLayout: (locationId: string, floorId: string) => void;
  /** Save / clear a location's perimeter polygon. */
  setLocationPerimeter: (locationId: string, polygon: GeoJSON.Polygon | null) => void;

  /**
   * Transient layout-edit session. While present, the LayoutEditor renders
   * over the map and the regular chrome is hidden. Lives in store (not local
   * state) so other components — LayoutOverlay especially — can preview
   * pending changes live.
   */
  editingLayout: EditingLayout | null;
  startLayoutEdit: (locationId: string, floorId: string) => void;
  updateEditingLayout: (patch: Partial<EditingLayout>) => void;
  commitLayoutEdit: () => void;
  cancelLayoutEdit: () => void;

  /** Transient perimeter-edit session. Active during state X. */
  editingPerimeter: { locationId: string; polygon: GeoJSON.Polygon | null } | null;
  startPerimeterEdit: (locationId: string) => void;
  updateEditingPerimeter: (polygon: GeoJSON.Polygon | null) => void;
  commitPerimeterEdit: () => void;
  cancelPerimeterEdit: () => void;

  /** Preview pin shown while the user is naming a location in the popover. */
  draftPin: { lng: number; lat: number } | null;
  setDraftPin: (p: { lng: number; lat: number } | null) => void;
  /** Location id currently being hovered (in the flyout list). Triggers pin highlight on the map. */
  hoverLocationId: string | null;
  setHoverLocationId: (id: string | null) => void;

  // Dev: seeded vs empty
  seedMode: SeedMode;
  setSeedMode: (m: SeedMode) => void;
  // Chrome toggles (states-sidebar footer)
  topBarVisible: boolean;
  setTopBarVisible: (b: boolean) => void;
  chromeMode: ChromeMode;
  setChromeMode: (m: ChromeMode) => void;
  /** Where the Q-state device panel docks. Right is default; left floats it
   *  just to the right of the locations flyout. */
  devicePanelSide: DevicePanelSide;
  setDevicePanelSide: (s: DevicePanelSide) => void;
}

export interface EditingLayout {
  locationId: string;
  floorId: string;
  imageUrl: string;
  filename?: string;
  /** Current 4 corners in lng/lat (clockwise from top-left). Updated live. */
  corners: FloorLayout['corners'];
  opacity: number;
  /** Position vs Crop. Crop is wired in step 4. */
  mode: 'position' | 'crop';
  /** Manual / Scale / Anchor — for now only manual is interactive. */
  subMode: 'manual' | 'scale' | 'anchor';
  /** Saved-corners snapshot taken at edit-start, used by Cancel to revert. */
  originalCorners: FloorLayout['corners'];
  originalOpacity: number;
  /** Active crop polygon (null = no crop, image renders fully). */
  crop: GeoJSON.Polygon | null;
  originalCrop: GeoJSON.Polygon | null;
}

export type SeedMode = 'empty' | 'seeded';
export type ChromeMode = 'pinned' | 'floating';

const STORAGE_KEY_THEME = 'maps-proto-theme';
const STORAGE_KEY_SEED = 'maps-proto-seed';
const STORAGE_KEY_TOPBAR = 'maps-proto-topbar';
const STORAGE_KEY_CHROME = 'maps-proto-chrome';
const STORAGE_KEY_DEV_PANEL_SIDE = 'maps-proto-devpanel-side';

function getInitialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'dark';
  const v = localStorage.getItem(STORAGE_KEY_THEME);
  return v === 'light' ? 'light' : 'dark';
}

function getInitialSeed(): SeedMode {
  if (typeof localStorage === 'undefined') return 'seeded';
  const v = localStorage.getItem(STORAGE_KEY_SEED);
  return v === 'empty' ? 'empty' : 'seeded';
}

function getInitialTopBar(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const v = localStorage.getItem(STORAGE_KEY_TOPBAR);
  return v === 'hidden' ? false : true;
}

function getInitialChrome(): ChromeMode {
  if (typeof localStorage === 'undefined') return 'pinned';
  const v = localStorage.getItem(STORAGE_KEY_CHROME);
  return v === 'floating' ? 'floating' : 'pinned';
}

function getInitialDevicePanelSide(): DevicePanelSide {
  if (typeof localStorage === 'undefined') return 'right';
  const v = localStorage.getItem(STORAGE_KEY_DEV_PANEL_SIDE);
  return v === 'left' ? 'left' : 'right';
}

function applyChromeAttr(mode: ChromeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-chrome', mode);
}

// Apply theme to <html data-theme="..."> on each change.
function applyThemeAttr(theme: Theme) {
  if (typeof document === 'undefined') return;
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}

export const useStore = create<Store>((set, get) => {
  // Apply once at startup
  const initialTheme = getInitialTheme();
  applyThemeAttr(initialTheme);

  const initialSeed = getInitialSeed();
  const initialChrome = getInitialChrome();
  applyChromeAttr(initialChrome);

  return {
    curState: initialSeed === 'empty' ? 'T' : 'D',
    goState: (id) => {
      // Closing the current event-detail flow erases its breadcrumb.
      if (id !== 'R') set({ eventBackTo: null });
      set({ curState: id });
    },

    theme: initialTheme,
    setTheme: (theme) => {
      applyThemeAttr(theme);
      try { localStorage.setItem(STORAGE_KEY_THEME, theme); } catch {}
      set({ theme });
    },

    layersOpen: false,
    toggleLayers: () => set((s) => ({ layersOpen: !s.layersOpen })),
    sidebarOpen: false,
    openSidebar: () => set({ sidebarOpen: true }),
    closeSidebar: () => set({ sidebarOpen: false }),

    openDropdown: null,
    toggleDropdown: (which) => {
      set((s) => ({ openDropdown: s.openDropdown === which ? null : which }));
    },
    closeAllDropdowns: () => set({ openDropdown: null }),

    deviceTitle: 'Railroad Kitchen Door',
    deviceKind: 'Door',
    deviceBackTo: null,
    openDeviceMarker: (name, kind = 'Door', fromLocationId = null) => {
      set({ deviceTitle: name, deviceKind: kind, openDropdown: null, deviceBackTo: fromLocationId });
      // Center the device a bit to the right so it isn't hidden behind the
      // left-side location panel (and, when the device panel docks left,
      // behind that too).
      const loc = fromLocationId
        ? get().locations.find((l) => l.id === fromLocationId)
        : null;
      if (loc) {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1400;
        // Push center left by ~one-third of the viewport so the device sits
        // around x ≈ 70% of the visible map.
        set({ flyTarget: { lng: loc.lng, lat: loc.lat, zoom: 18, padding: { left: Math.round(w * 0.55), right: 0, top: 0, bottom: 0 } } });
      }
      get().goState('Q');
    },
    dismissDevicePanel: () => {
      // Step back to the location detail (V) so the left flyout stays open.
      const selId = get().selectedLocationId;
      set({ eventBackTo: null });
      get().goState(selId ? 'V' : 'D');
    },

    currentEvent: EVENT_DATA['door-forced'],
    eventBackTo: null,
    openEvent: (key, from) => {
      const ev = EVENT_DATA[key] ?? EVENT_DATA['door-forced'];
      set({
        currentEvent: ev,
        eventBackTo: from === 'device' ? 'Q' : null,
        openDropdown: null,
      });
      // goState clears eventBackTo when target !== 'R', so set the state first then re-set backTo.
      get().goState('R');
      set({ eventBackTo: from === 'device' ? 'Q' : null });
    },
    backFromEvent: () => {
      const target = get().eventBackTo ?? 'A';
      set({ eventBackTo: null });
      get().goState(target);
    },
    dismissEventPanel: () => {
      // Mirror dismissDevicePanel: close just the alerts panel, leave the
      // location detail / list intact. Prefer eventBackTo (Q), else V if a
      // location is selected, else fall back to the list (D).
      const back = get().eventBackTo;
      const selId = get().selectedLocationId;
      set({ eventBackTo: null });
      if (back) get().goState(back);
      else if (selId) get().goState('V');
      else get().goState('D');
    },
    closeFlyout: () => {
      set({ eventBackTo: null });
      get().goState('A');
    },

    basemap: 'street',
    setBasemap: (b) => set({ basemap: b }),

    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
    flyTarget: null,
    flyTo: (t) => set({ flyTarget: { ...t } }),
    fitBoundsTarget: null,
    fitBounds: (sw, ne) => set({ fitBoundsTarget: { sw, ne } }),
    zoomRequest: null,
    zoomIn: () => set((s) => ({ zoomRequest: { dir: 'in', tick: (s.zoomRequest?.tick ?? 0) + 1 } })),
    zoomOut: () => set((s) => ({ zoomRequest: { dir: 'out', tick: (s.zoomRequest?.tick ?? 0) + 1 } })),
    centerOnAllLocations: () => {
      const locs = get().locations;
      if (locs.length === 0) {
        // Nothing to fit — reset to the Bay Area overview.
        set({ flyTarget: { lng: -122.18, lat: 37.6, zoom: 9 } });
        return;
      }
      if (locs.length === 1) {
        const l = locs[0];
        set({ flyTarget: { lng: l.lng, lat: l.lat, zoom: 14 } });
        return;
      }
      const lngs = locs.map((l) => l.lng);
      const lats = locs.map((l) => l.lat);
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
      set({ fitBoundsTarget: { sw, ne } });
    },

    locations: initialSeed === 'seeded' ? LOCATIONS : [],
    selectedLocationId: null,
    selectLocation: (id) => {
      const loc = get().locations.find((l) => l.id === id);
      if (!loc) return;
      // Bias the camera right of the location panel so the marker is visible.
      const w = typeof window !== 'undefined' ? window.innerWidth : 1400;
      set({
        selectedLocationId: id,
        selectedFloorId: loc.floors[0]?.id ?? null,
        flyTarget: { lng: loc.lng, lat: loc.lat, zoom: 17, padding: { left: Math.round(w * 0.35), right: 0, top: 0, bottom: 0 } },
      });
      get().goState('V');
    },
    selectedFloorId: null,
    setSelectedFloor: (id) => set({ selectedFloorId: id }),

    createOpen: false,
    setCreateOpen: (b) => set({ createOpen: b, ...(b ? {} : { draftPin: null }) }),
    draftPin: null,
    setDraftPin: (p) => set({ draftPin: p }),
    hoverLocationId: null,
    setHoverLocationId: (id) => set({ hoverLocationId: id }),
    addLocation: (draft) => {
      const id = `loc-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`;
      const newLoc: Location = {
        id,
        name: draft.name,
        lng: draft.lng,
        lat: draft.lat,
        address: draft.address,
        deviceCount: 0,
        onlineCount: 0,
        siteIds: [],
        floors: [],
        setupStatus: 'pending',
      };
      set((s) => ({ locations: [...s.locations, newLoc], draftPin: null }));
      // Drop the user near the new pin so they see it land.
      set({ flyTarget: { lng: draft.lng, lat: draft.lat, zoom: 14 } });
      return id;
    },
    updateLocation: (id, patch) => {
      set((s) => ({
        locations: s.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }));
    },
    deleteLocation: (id) => {
      set((s) => ({
        locations: s.locations.filter((l) => l.id !== id),
        selectedLocationId: s.selectedLocationId === id ? null : s.selectedLocationId,
      }));
      // If the user was viewing this location, bounce back to the list.
      const cur = get().curState;
      if (cur === 'V' || cur === 'Q' || cur === 'R') get().goState('D');
    },
    graduateLocation: (id, patch) => {
      set((s) => ({
        locations: s.locations.map((l) =>
          l.id === id
            ? {
                ...l,
                ...patch,
                setupStatus: 'configured' as const,
                deviceCount: l.deviceCount > 0 ? l.deviceCount : 0,
                onlineCount: l.onlineCount > 0 ? l.onlineCount : 0,
              }
            : l,
        ),
      }));
    },
    setFloorLayout: (locationId, floorId, layout) => {
      set((s) => ({
        locations: s.locations.map((l) =>
          l.id === locationId
            ? { ...l, floors: l.floors.map((f) => (f.id === floorId ? { ...f, layout } : f)) }
            : l,
        ),
      }));
    },
    updateFloorLayout: (locationId, floorId, patch) => {
      set((s) => ({
        locations: s.locations.map((l) =>
          l.id === locationId
            ? {
                ...l,
                floors: l.floors.map((f) =>
                  f.id === floorId && f.layout
                    ? { ...f, layout: { ...f.layout, ...patch } }
                    : f,
                ),
              }
            : l,
        ),
      }));
    },
    clearFloorLayout: (locationId, floorId) => {
      set((s) => ({
        locations: s.locations.map((l) =>
          l.id === locationId
            ? { ...l, floors: l.floors.map((f) => (f.id === floorId ? { ...f, layout: null } : f)) }
            : l,
        ),
      }));
    },
    setLocationPerimeter: (locationId, polygon) => {
      set((s) => ({
        locations: s.locations.map((l) =>
          l.id === locationId ? { ...l, perimeter: polygon } : l,
        ),
      }));
    },

    editingLayout: null,
    startLayoutEdit: (locationId, floorId) => {
      const loc = get().locations.find((l) => l.id === locationId);
      const floor = loc?.floors.find((f) => f.id === floorId);
      if (!loc || !floor?.layout) return;
      set({
        editingLayout: {
          locationId,
          floorId,
          imageUrl: floor.layout.imageUrl,
          filename: floor.layout.filename,
          corners: floor.layout.corners,
          opacity: floor.layout.opacity,
          mode: 'position',
          subMode: 'manual',
          originalCorners: floor.layout.corners,
          originalOpacity: floor.layout.opacity,
          crop: floor.layout.crop ?? null,
          originalCrop: floor.layout.crop ?? null,
        },
      });
      get().goState('Z');
    },
    updateEditingLayout: (patch) => {
      set((s) => (s.editingLayout ? { editingLayout: { ...s.editingLayout, ...patch } } : {}));
    },
    commitLayoutEdit: () => {
      const e = get().editingLayout;
      if (!e) return;
      get().updateFloorLayout(e.locationId, e.floorId, {
        corners: e.corners,
        opacity: e.opacity,
        crop: e.crop,
      });
      set({ editingLayout: null });
      get().goState('V');
    },
    cancelLayoutEdit: () => {
      set({ editingLayout: null });
      get().goState('V');
    },

    editingPerimeter: null,
    startPerimeterEdit: (locationId) => {
      const loc = get().locations.find((l) => l.id === locationId);
      if (!loc) return;
      set({
        editingPerimeter: { locationId, polygon: loc.perimeter ?? null },
        selectedLocationId: locationId,
      });
      get().goState('X');
    },
    updateEditingPerimeter: (polygon) => {
      set((s) => (s.editingPerimeter ? { editingPerimeter: { ...s.editingPerimeter, polygon } } : {}));
    },
    commitPerimeterEdit: () => {
      const e = get().editingPerimeter;
      if (!e) return;
      get().setLocationPerimeter(e.locationId, e.polygon);
      set({ editingPerimeter: null });
      get().goState('V');
    },
    cancelPerimeterEdit: () => {
      set({ editingPerimeter: null });
      get().goState('V');
    },

    topBarVisible: getInitialTopBar(),
    setTopBarVisible: (b) => {
      try { localStorage.setItem(STORAGE_KEY_TOPBAR, b ? 'visible' : 'hidden'); } catch {}
      set({ topBarVisible: b });
    },
    chromeMode: initialChrome,
    setChromeMode: (m) => {
      applyChromeAttr(m);
      try { localStorage.setItem(STORAGE_KEY_CHROME, m); } catch {}
      set({ chromeMode: m });
    },

    seedMode: initialSeed,
    setSeedMode: (m) => {
      try { localStorage.setItem(STORAGE_KEY_SEED, m); } catch {}
      set({
        seedMode: m,
        // Replace the locations list — drop any pending ones the user had
        // created while exploring, since switching modes is a reset action.
        locations: m === 'seeded' ? LOCATIONS : [],
        selectedLocationId: null,
        selectedFloorId: null,
      });
      // If the user is currently in V or T, bounce back to the canonical
      // landing for the new mode (U for seeded, T for empty).
      const cur = get().curState;
      if (m === 'empty' && cur !== 'T') get().goState('T');
      if (m === 'seeded' && cur === 'T') get().goState('D');
    },

    devicePanelSide: getInitialDevicePanelSide(),
    setDevicePanelSide: (s) => {
      try { localStorage.setItem(STORAGE_KEY_DEV_PANEL_SIDE, s); } catch {}
      set({ devicePanelSide: s });
    },
  };
});

// Convenience selector for the currently selected Location object (or null).
export const selectCurrentLocation = (s: Store): Location | null => {
  if (!s.selectedLocationId) return null;
  return s.locations.find((l) => l.id === s.selectedLocationId) ?? null;
};

// Convenience selectors
export const selectFlyoutOpen = (s: Store) => {
  if (FLYOUT_STATES.includes(s.curState)) return true;
  // The location-detail "page 2" of the left panel (V/Q/R with a selection)
  // also occupies the flyout slot, so neighbors should shift right for it.
  if ((s.curState === 'V' || s.curState === 'Q' || s.curState === 'R') && s.selectedLocationId) return true;
  return false;
};
export const selectIsEditor = (s: Store) => s.curState === 'I';
export const selectIsSettings = (s: Store) => s.curState === 'P';
