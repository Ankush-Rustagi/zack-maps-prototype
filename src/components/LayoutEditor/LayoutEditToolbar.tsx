import { useMap } from 'react-map-gl/mapbox';
import { useStore, selectCurrentLocation } from '../../store';

/**
 * Bottom-center editor toolbar. Position / Crop top-level toggle (Crop wired in
 * step 4), Manual / Scale / Anchor sub-modes (Scale + Anchor stubbed for now),
 * opacity + bearing sliders, ending in Save.
 */
export function LayoutEditToolbar() {
  const editing = useStore((s) => s.editingLayout);
  const update = useStore((s) => s.updateEditingLayout);
  const commit = useStore((s) => s.commitLayoutEdit);
  const location = useStore(selectCurrentLocation);
  const maps = useMap();
  const mapRef = maps.main ?? maps.current;
  const map = mapRef?.getMap();

  if (!editing) return null;

  function setBearing(b: number) { map?.setBearing(b); }
  const currentBearing = Math.round(map?.getBearing() ?? 0);
  const isCrop = editing.mode === 'crop';
  const hasPerimeter = !!location?.perimeter;

  return (
    <div className="layout-edit-toolbar" onClick={(e) => e.stopPropagation()}>
      <div className="let-mode-seg">
        <button className={!isCrop ? 'on' : ''} onClick={() => update({ mode: 'position' })}>Position</button>
        <button className={isCrop ? 'on' : ''} onClick={() => update({ mode: 'crop' })}>Crop</button>
      </div>

      <div className="let-divider" />

      {!isCrop ? (
        <>
          <div className="let-mode-seg">
            <button className={editing.subMode === 'manual' ? 'on' : ''} onClick={() => update({ subMode: 'manual' })}>Manual</button>
            <button className={editing.subMode === 'scale' ? 'on' : ''} disabled title="Coming soon">Scale</button>
            <button className={editing.subMode === 'anchor' ? 'on' : ''} disabled title="Coming soon">Anchor</button>
          </div>
          <div className="let-divider" />
        </>
      ) : (
        <>
          {hasPerimeter && (
            <button
              className="let-action-btn"
              onClick={() => update({ crop: location?.perimeter ?? null })}
              title="Pre-fill the crop polygon from this location's perimeter"
            >Use perimeter</button>
          )}
          {editing.crop && (
            <button
              className="let-action-btn amber"
              onClick={() => update({ crop: null })}
              title="Remove the crop"
            >Clear crop</button>
          )}
          <div className="let-divider" />
        </>
      )}

      <div className="let-slider-group">
        <span className="lbl">Opacity</span>
        <input
          className="let-slider"
          type="range"
          min={10}
          max={100}
          value={Math.round(editing.opacity * 100)}
          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
        />
        <span className="let-slider-val">{Math.round(editing.opacity * 100)}%</span>
      </div>

      <div className="let-divider" />

      <div className="let-slider-group">
        <span className="lbl">Bearing</span>
        <input
          className="let-slider"
          type="range"
          min={-180}
          max={180}
          value={currentBearing}
          onChange={(e) => setBearing(Number(e.target.value))}
        />
        <span className="let-slider-val">{currentBearing}°</span>
      </div>

      <div className="let-divider" />

      <button className="ce-save" onClick={commit}>Save</button>
    </div>
  );
}
