import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-map-gl/mapbox';
import { useStore, selectCurrentLocation } from '../../store';
import { PolygonDrawer } from '../Polygon/PolygonDrawer';

/**
 * State X — perimeter-draw mode. Banner + PolygonDrawer + Save/Cancel wiring.
 * Mounted inside <Map> so PolygonDrawer can use useMap(); the banner is
 * portaled to document.body so it stays above all map layers and doesn't
 * eat clicks that should reach the polygon drawer.
 */
export function PerimeterDraw() {
  const editing = useStore((s) => s.editingPerimeter);
  const updateEditing = useStore((s) => s.updateEditingPerimeter);
  const commit = useStore((s) => s.commitPerimeterEdit);
  const cancel = useStore((s) => s.cancelPerimeterEdit);
  const location = useStore(selectCurrentLocation);
  const maps = useMap();
  const mapRef = maps.main ?? maps.current;

  // ESC = cancel, ⌘/Ctrl+Enter = save (when polygon exists).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
      if (e.key === 'Escape') cancel();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commit();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cancel, commit]);

  // Recenter on the location when entering X (so the user has context).
  useEffect(() => {
    if (!mapRef || !location) return;
    mapRef.flyTo({ center: [location.lng, location.lat], zoom: 17, duration: 500 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.locationId]);

  if (!editing) return null;
  const hasPolygon = !!editing.polygon;

  return (
    <>
      <PolygonDrawer
        value={editing.polygon}
        onChange={updateEditing}
        color="#4a7af7"
        idPrefix="perimeter-draw"
      />

      {createPortal(
        <div className="perim-banner">
          <span className="label">Defining perimeter</span>
          <span className="sep">·</span>
          <span className="sub">{location?.name ?? 'Location'}</span>
          <span className="sep">·</span>
          <span className="hint">
            {hasPolygon ? 'Drag vertices to refine' : 'Click to add vertices · double-click or click first to close'}
          </span>
          <button className="ce-cancel" onClick={cancel}>Cancel</button>
          <button className="ce-save" onClick={commit} disabled={!hasPolygon}>Save</button>
        </div>,
        document.body,
      )}
    </>
  );
}
