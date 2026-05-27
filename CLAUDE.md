# Verkada Maps 2.0 — Prototype

A design exploration for the next-gen Verkada Maps experience. Vite + React + TypeScript SPA, real Mapbox basemap, in-memory mock data.

## Where things live

- **Project root**: `/Users/zack.baumel/Desktop/Projects/Map Explorations/Maps Exploration 5:20/maps-prototype/`
- **Legacy single-file prototype** (kept as a design reference): `../prototype.html` — do not edit
- **Original layout-editor reference** (for the Maps Start V2 patterns we ported): `../Maps Start V2/src/components/` — read-only

## Run it

```sh
cd "/Users/zack.baumel/Desktop/Projects/Map Explorations/Maps Exploration 5:20/maps-prototype"
PATH="./node_modules/.bin:$PATH" vite        # dev server, usually http://localhost:5174/
PATH="./node_modules/.bin:$PATH" tsc -b      # type check
PATH="./node_modules/.bin:$PATH" vite build  # production build
```

If a stale dev server is running: `kill $(cat /tmp/vite-dev.pid)`.

## Stack

- Vite 8, React 19, TypeScript
- `react-map-gl/mapbox` 8.1 + `mapbox-gl` 3.x — Map wrapped in `<MapProvider>` (see `src/main.tsx`), accessed via `useMap()` keyed as `main`
- Zustand 5 — single store, no slicing, everything in `src/store.ts`
- No router. State-machine pattern: `curState: StateId` in Zustand drives which panels render
- Plain CSS with variables — `src/theme.css` (tokens) + `src/styles.css` (~1000 lines, all component styles)
- **No `@mapbox/mapbox-gl-draw`** — we removed it (didn't capture clicks). Polygon drawing is homegrown in `src/components/Polygon/PolygonDrawer.tsx` using raw map.on('click') events.

## Mapbox config

`.env` has the user's token + two custom style URLs (one for light, one for dark theme). The MapView reads them. Without a token, falls back to a CSS-grid placeholder map.

```
VITE_MAPBOX_TOKEN=pk....
VITE_MAPBOX_STYLE_LIGHT=mapbox://styles/...
VITE_MAPBOX_STYLE_DARK=mapbox://styles/...
```

`.gitignore` excludes `.env`.

## State machine

`curState: StateId` lives in `src/store.ts`. All entries in `src/states.ts`. The States sidebar (press `S`) lists them and lets you jump between.

| State | Name | Notes |
|---|---|---|
| A | Null state | Legacy placeholder; not the default |
| B | Rail default | Legacy alias of A |
| C/D/E/F/L/O | Flyouts: Recents / Locations / Collections / Files / File dropzone / Collection detail | |
| G | Place selected | Legacy place card |
| H | Editor entry | Pulsing CTA before editor |
| I | Editor | Device-placement editor (mocked) |
| J | Search active | Toolbar search dropdown shown |
| K | Site picker | Toolbar's filter button open |
| M | Place + drag | Drop hint variant |
| N | File attaching | Attach modal |
| P | Settings | Full-takeover panel |
| Q | Device detail | Right panel with camera + status + events |
| R | Event detail | Alert/event right panel; supports Back nav |
| T | Empty data | seedMode==='empty' default landing |
| **U** | **Cluster overview** | Default landing when seedMode==='seeded'. Donut tokens. |
| **V** | **Location view** | Zoomed into a single location, right panel open |
| W | Address pinned | Legacy stub from earlier plan |
| **X** | **Perimeter draw** | Homegrown polygon drawer |
| Y | Attach layout | Legacy stub from earlier plan |
| **Z** | **Edit layout** | Position sub-mode (translate/rotate/scale) + Crop sub-mode (polygon draw) |

Editor (Z) and Settings (P) and Perimeter (X) take over the screen — App hides chrome via `curState === 'Z' || 'X'` check.

## Key data shapes

`src/data/locations.ts`:
```ts
Location = {
  id, name, lng, lat, address?,
  deviceCount, onlineCount,
  siteIds: string[],     // multi-site
  floors: LocationFloor[],
  perimeter?: GeoJSON.Polygon | null,
  setupStatus: 'pending' | 'configured',
}
LocationFloor = { id, name, layout?: FloorLayout | null }
FloorLayout = { imageUrl, filename?, corners: [[lng,lat]×4], opacity, crop?: GeoJSON.Polygon | null }
```

`src/data/sites.ts` — hardcoded list of `SITES` (HQ-MAIN, WAREHOUSE-A, etc).
`src/data/inventory.ts` — mock "existing Verkada platform" buildings with floors+device counts; used by the InventoryPicker. Has `rankInventoryByAddress(addr)` for the Suggested match.
`src/data/devices.ts` — legacy mock devices used only in states G/H/M.
`src/data/events.ts` — EVENT_DATA for the event panel.
`src/data/csv.ts` — bulk-import parsing.
`src/data/geocode.ts` — Mapbox geocoding helper used by the address search and CSV bulk.
`src/data/layoutMath.ts` — corner projection + translate/rotate/scale math for the layout editor.

## Store (src/store.ts) — important slots

- `curState`, `goState(id)`
- `theme` (persists; `[data-theme]` attr applied), `chromeMode: 'pinned'|'floating'` (persists; `[data-chrome]`), `topBarVisible` (persists), `seedMode: 'empty'|'seeded'` (persists, drives `locations` seed)
- `locations`, `selectedLocationId`, `selectedFloorId`, `selectLocation(id)`, `updateLocation(id, patch)`, `deleteLocation(id)`, `addLocation(draft) → id`, `graduateLocation(id, patch)`
- `createOpen`, `setCreateOpen(b)`, `draftPin`, `hoverLocationId`
- `editingLayout` (Z transient state — copies of floor.layout) + `startLayoutEdit / updateEditingLayout / commitLayoutEdit / cancelLayoutEdit`
- `editingPerimeter` (X transient) + `startPerimeterEdit / updateEditingPerimeter / commitPerimeterEdit / cancelPerimeterEdit`
- `flyTo(t)`, `fitBoundsTarget` + `centerOnAllLocations()`, `zoomIn/Out` (MapView watches these effects)
- `openEvent / backFromEvent` + `eventBackTo`; `openDeviceMarker(name, fromLocationId?)` + `deviceBackTo`

## Component layout

```
src/
├── App.tsx                       composition root; hides chrome in Z/X
├── main.tsx                      <MapProvider>+<StrictMode>+<App>
├── components/
│   ├── CommandBar.tsx            top bar (toggleable via States sidebar)
│   ├── NavRail.tsx               left rail; shows waffle when topBar hidden
│   ├── Toolbar.tsx               search + filter + alerts; Add-location button is next to it
│   ├── CreateLocationPopover.tsx anchored to Add-location button
│   ├── BulkAddModal.tsx          CSV bulk upload from a popover link
│   ├── StatesSidebar.tsx         press S; footer has 3 toggles (TopBar, Chrome, Seed)
│   ├── LayersUi.tsx              bottom-left Layers/States toolbar + popup
│   ├── Flyouts.tsx               C/D/E/F/L/O bodies. LocationsFlyout reads from store
│   ├── RightPanels.tsx           PlaceCard (configured), PendingPlaceCard (setup form), DevicePanel (Q), EventPanel (R)
│   ├── Editor.tsx                I-state full editor chrome (mostly mock)
│   ├── Settings.tsx              P state
│   ├── InventoryPicker.tsx       modal opened from PendingPlaceCard "+ From existing"
│   ├── MapView.tsx               <Map> + <ClusterLayer> + <LayoutOverlay> outline + zoom toolbar
│   ├── Map/
│   │   ├── ClusterToken.tsx      SVG donut. is-empty/is-hover/aggregate variants
│   │   ├── ClusterLayer.tsx      GeoJSON cluster source + per-feature Markers, also renders pending pins + draftPin
│   │   ├── PendingPin.tsx        teardrop SVG
│   │   ├── LayoutOverlay.tsx     ONLY the crop-outline GL layer; image itself is DOM
│   │   ├── FloorplanDOMOverlay.tsx  DOM <img> in screen space with CSS clip-path. Re-projects on map move
│   │   └── PerimeterOverlay.tsx  GL fill+line for saved perimeters (V + faint in U)
│   ├── LayoutEditor/
│   │   ├── LayoutEditor.tsx      banner + Save/Cancel; keyboard shortcuts
│   │   ├── LayoutEditHandles.tsx SVG handles (translate body / scale corners / rotate stem). Inside Map.
│   │   ├── LayoutEditToolbar.tsx Position/Crop, Manual sub-mode, opacity, bearing
│   │   └── CropDraw.tsx          thin wrapper around PolygonDrawer for editingLayout.crop
│   ├── Perimeter/
│   │   └── PerimeterDraw.tsx     wrapper around PolygonDrawer + portal banner
│   └── Polygon/
│       └── PolygonDrawer.tsx     homegrown polygon edit/draw via raw map.on() events
├── data/...                      (see above)
├── states.ts                     STATES array + FLYOUT_STATES
├── store.ts                      ~600 lines
├── theme.css                     CSS variables, dark/light
└── styles.css                    ~1100 lines of component styles
```

## Important architectural details

- **DOM-img floorplan**: The layout image is **not** a Mapbox raster source — Mapbox can't geometrically clip rasters. We render it as a positioned `<img>` in screen space (corners→pixels each frame via `map.project()`) so CSS `clip-path` works. Sees `FloorplanDOMOverlay.tsx`. The Mapbox raster-image-source code paths are all gone.
- **Clip precedence**: `editingLayout.crop` (live during Z) → `floor.layout.crop` (saved) → `location.perimeter` (fallback). While the user is actively drawing the crop in Z, clipping is suppressed so they see the full image.
- **Polygon drawer**: `PolygonDrawer.tsx` is shared by both perimeter (state X, accent-blue) and crop (Z sub-mode, green). Vertices stored in component state, value flows back via `onChange`. Pre-seeded from prop on mount.
- **Floating chrome mode**: `[data-chrome="floating"]` on `<html>` re-positions nav rail + flyouts + toolbar + bl-toolbar + popups via override CSS rules. Toggled from the States sidebar footer.
- **Empty / Seeded seed**: `seedMode === 'empty'` clears `locations`, sets curState to T. Seeded restores the 6 mock locations and goes to U.
- **`.mapboxgl-marker { z-index: 3 }`** in styles.css — required so HTML markers (cluster donuts, pending pins) sit above the DOM floorplan overlay.

## Known/intentional gaps

- **Step 5 (Contextual nudges)** from the layout plan is still pending — empty-state chips on the map ("Define perimeter →", "Add layout →"), post-save toasts with optional next steps. Plan file: `/Users/zack.baumel/.claude/plans/hazy-crunching-lampson.md`.
- **Devices model is mock**. `Location.deviceCount`/`onlineCount` are scalars; per-device data lives only in `MOCK_DEVICES_FOR_LOCATION` inside `RightPanels.tsx`. "Placed" vs "Unplaced" in the Devices tab is a hardcoded boolean per row. Real device placement on layouts is unbuilt.
- **W and Y states** in the sidebar are legacy stubs from the original plan; not wired to anything meaningful.
- **PDF floorplans** are not supported — only PNG/JPG (`pdf.js` rasterization is the deferred path).
- **No undo**. All edits commit immediately, except editingLayout/editingPerimeter sessions which have Cancel.

## Plan file (history)

`/Users/zack.baumel/.claude/plans/hazy-crunching-lampson.md` — the working plan. Contains the migration plan, cluster/location/creation flow plan, simplified-creation plan, and layout/perimeter/crop plan with build order.

## Coding patterns

- **Add a new state**: extend `StateId` in `src/states.ts`, append to `STATES` array, render conditionally in App or in relevant component, add behavior in store.
- **Add a new store slot**: add to the `Store` interface, init in the create() callback, use in components via `useStore(s => s.x)`. Persisted values follow the existing `STORAGE_KEY_*` pattern.
- **Show something on the map**: GL layer → render as `<Source>` + `<Layer>` inside `<Map>` in MapView. HTML overlay → render as `<Marker>` (Mapbox-positioned) or as a DOM element in App (manually projected, see FloorplanDOMOverlay).
- **Drawing polygons**: reuse `PolygonDrawer`. It's a child of `<Map>` and uses `useMap()` to get the map.

## Quick smoke test after major changes

1. Refresh; lands on U with 6 donut tokens visible
2. Click a donut → flies in, V state, location panel opens
3. Layouts tab → upload a floorplan → it renders as DOM img on map at default corners
4. Edit position → SVG handles, drag/rotate/scale, Save
5. Overview → Define perimeter → draw polygon → Save → image gets clipped to perimeter
6. Layouts → Edit crop → draw a tighter polygon → Save → image now clipped to crop
7. Toggle Dark/Light in Layers popup → both basemap and chrome flip
8. States sidebar → switch Seed to Empty → 6 mocks vanish; switch back to Seeded → restored
9. Add Location → search address → Save & close → opens pending panel with sites/perimeter/floors form
