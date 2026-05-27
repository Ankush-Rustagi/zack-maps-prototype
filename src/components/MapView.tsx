import { useEffect, useMemo, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Basemap } from '../store';
import { useStore } from '../store';
import { DEVICES } from '../data/devices';
import { OVERVIEW_VIEW } from '../data/locations';
import { ClusterLayer } from './Map/ClusterLayer';
import { LayoutOverlay } from './Map/LayoutOverlay';
import { PerimeterOverlay } from './Map/PerimeterOverlay';
import { PerimeterDraw } from './Perimeter/PerimeterDraw';
import { CropDraw } from './LayoutEditor/CropDraw';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const CUSTOM_LIGHT = import.meta.env.VITE_MAPBOX_STYLE_LIGHT as string | undefined;
const CUSTOM_DARK = import.meta.env.VITE_MAPBOX_STYLE_DARK as string | undefined;

// Map our basemap state → a Mapbox style URL (or null for "no map" mode).
// "Street" picks the org's custom light/dark style if set; otherwise falls back
// to Mapbox's stock light/dark based on the current theme.
function styleForBasemap(b: Basemap, theme: 'dark' | 'light'): string | null {
  if (b === 'none') return null;
  if (b === 'satellite') return 'mapbox://styles/mapbox/satellite-streets-v12';
  if (theme === 'light') return CUSTOM_LIGHT ?? 'mapbox://styles/mapbox/light-v11';
  return CUSTOM_DARK ?? 'mapbox://styles/mapbox/dark-v11';
}

export function MapView() {
  const openDeviceMarker = useStore((s) => s.openDeviceMarker);
  const closeAllDropdowns = useStore((s) => s.closeAllDropdowns);
  const basemap = useStore((s) => s.basemap);
  const theme = useStore((s) => s.theme);
  const curState = useStore((s) => s.curState);
  const isEmpty = curState === 'T';
  // Show pins (donut + pending) everywhere EXCEPT editor mode and settings.
  // Flyouts, dropdowns, panels, even the legacy place card states all keep
  // location pins visible on the map.
  const showClusters = curState !== 'I' && curState !== 'P';
  // Legacy device markers from data/devices.ts only inside the legacy
  // place-card single-floor view (G/H/M).
  const showLegacyMarkers = ['G', 'H', 'M'].includes(curState);
  const flyTarget = useStore((s) => s.flyTarget);
  const fitBoundsTarget = useStore((s) => s.fitBoundsTarget);
  const mapRef = useRef<MapRef | null>(null);


  // When the store gets a new flyTarget, ask Mapbox to fly there.
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: flyTarget.zoom ?? 16,
      // Padding biases the visible center so the marker isn't hidden behind
      // an open panel.
      padding: flyTarget.padding,
      essential: true,
    });
  }, [flyTarget]);

  // Fit-to-bounds (center on all locations).
  useEffect(() => {
    if (!fitBoundsTarget || !mapRef.current) return;
    mapRef.current.fitBounds(
      [fitBoundsTarget.sw, fitBoundsTarget.ne],
      { padding: { top: 80, right: 400, bottom: 100, left: 100 }, duration: 700, maxZoom: 16 },
    );
  }, [fitBoundsTarget]);

  // Imperative zoom requests from the bottom-right toolbar.
  const zoomRequest = useStore((s) => s.zoomRequest);
  useEffect(() => {
    if (!zoomRequest || !mapRef.current) return;
    if (zoomRequest.dir === 'in') mapRef.current.zoomIn();
    else mapRef.current.zoomOut();
  }, [zoomRequest]);

  // The map's container size changes when the top bar mounts/unmounts or the
  // chrome flips pinned↔floating. Mapbox doesn't detect this automatically, so
  // call resize() after the next paint to keep the GL canvas in sync.
  const topBarVisible = useStore((s) => s.topBarVisible);
  const chromeMode = useStore((s) => s.chromeMode);
  useEffect(() => {
    if (!mapRef.current) return;
    const raf = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(raf);
  }, [topBarVisible, chromeMode]);

  // When no token is set, fall back to the original CSS-grid placeholder so
  // the prototype works out of the box. The Mapbox token comes from .env.
  if (!TOKEN) return <PlaceholderMap isEmpty={isEmpty} />;

  const style = styleForBasemap(basemap, theme);

  return (
    <div className="map-canvas" onClick={closeAllDropdowns}>
      <Map
        id="main"
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: OVERVIEW_VIEW.lng, latitude: OVERVIEW_VIEW.lat, zoom: OVERVIEW_VIEW.zoom }}
        mapStyle={style ?? undefined}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
      >
        {/* Perimeter outline — under the layout/markers so they overlay it. */}
        <PerimeterOverlay />
        {/* Floor layout image — rendered under markers, before clusters. */}
        <LayoutOverlay />
        {showClusters && <ClusterLayer />}
        {curState === 'X' && <PerimeterDraw />}
        <CropDrawSlot />
        {showLegacyMarkers && DEVICES.map((d) => (
          <Marker key={d.id} longitude={d.lng} latitude={d.lat} anchor="center">
            <div
              className={`mb-marker ${d.kind === 'door' ? 'sq' : 'dot'}`}
              style={d.kind === 'door' ? undefined : { background: d.color ?? '#4a7af7' }}
              title={d.name}
              onClick={(e) => {
                e.stopPropagation();
                openDeviceMarker(d.name);
              }}
            />
          </Marker>
        ))}
      </Map>
      <ZoomControls />
    </div>
  );
}

// Pure-CSS map shown when no Mapbox token is configured.
function PlaceholderMap({ isEmpty }: { isEmpty: boolean }) {
  const openDeviceMarker = useStore((s) => s.openDeviceMarker);
  const closeAllDropdowns = useStore((s) => s.closeAllDropdowns);

  const placeholderMarkers = useMemo(() => ([
    { name: 'Door-Lobby-N1', kind: 'sq',  style: { left: '33%', top: '40%', width: 18, height: 18 } as const },
    { name: 'Cam-Lobby-01',  kind: 'dot', style: { left: '41%', top: '56%', background: '#4a7af7' } as const },
    { name: 'Cam-Lobby-02',  kind: 'dot', style: { left: '53%', top: '46%', background: '#94a3b8' } as const },
    { name: 'Cam-Dock-04',   kind: 'dot', style: { left: '38%', top: '62%', background: '#4a7af7' } as const },
  ]), []);

  return (
    <div className="map-canvas" onClick={closeAllDropdowns}>
      {!isEmpty && placeholderMarkers.map((m) => (
        <div
          key={m.name}
          className={m.kind === 'sq' ? 'm-sq' : 'm-dot'}
          style={m.style as React.CSSProperties}
          title={m.name}
          onClick={(e) => { e.stopPropagation(); openDeviceMarker(m.name); }}
        />
      ))}
      {!isEmpty && (
        <div className="mb-empty">
          <div>Map placeholder · add a Mapbox token to enable the live map</div>
          <div>Copy <code>.env.example</code> → <code>.env</code> and set <code>VITE_MAPBOX_TOKEN</code></div>
        </div>
      )}
      <ZoomControls />
    </div>
  );
}

/**
 * Mounts CropDraw only while the layout editor is active AND in Crop sub-mode.
 * MapboxDraw can be expensive to attach/detach, so we keep this surgically
 * scoped instead of always-on.
 */
function CropDrawSlot() {
  const isCrop = useStore((s) => s.curState === 'Z' && s.editingLayout?.mode === 'crop');
  return isCrop ? <CropDraw /> : null;
}

/**
 * Bottom-right zoom toolbar — three buttons: zoom in, zoom out, fit-to-all.
 * Each just calls a store action; MapView's effects pick them up.
 */
function ZoomControls() {
  const zoomIn = useStore((s) => s.zoomIn);
  const zoomOut = useStore((s) => s.zoomOut);
  const centerOnAllLocations = useStore((s) => s.centerOnAllLocations);
  return (
    <div className="zoom">
      <button className="zoom-btn" title="Zoom in" onClick={(e) => { e.stopPropagation(); zoomIn(); }}>+</button>
      <button className="zoom-btn" title="Zoom out" onClick={(e) => { e.stopPropagation(); zoomOut(); }}>−</button>
      <button className="zoom-btn" title="Fit to all locations" onClick={(e) => { e.stopPropagation(); centerOnAllLocations(); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9V5a2 2 0 0 1 2-2h4" />
          <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
          <path d="M3 15v4a2 2 0 0 0 2 2h4" />
          <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
        </svg>
      </button>
    </div>
  );
}
