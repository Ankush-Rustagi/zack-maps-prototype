import { Source, Layer } from 'react-map-gl/mapbox';
import { useStore, selectCurrentLocation } from '../../store';
import type { FeatureCollection, Polygon } from 'geojson';

/**
 * Renders the currently-selected location's active-floor layout as a Mapbox
 * image source. Only shows in V (Location view) — when zoomed out, layouts
 * would be too small to be meaningful and would also cause cluster congestion.
 *
 * Crop mask is applied via an inverse-fill technique (step 4): a polygon
 * covering everything OUTSIDE the crop polygon, in the map background color,
 * sits between the image and the device markers. Not yet wired here.
 */
export function LayoutOverlay() {
  const curState = useStore((s) => s.curState);
  const location = useStore(selectCurrentLocation);
  const selectedFloorId = useStore((s) => s.selectedFloorId);
  const editingLayout = useStore((s) => s.editingLayout);

  // Visible in both V (read-only) and Z (live preview while editing).
  if (curState !== 'V' && curState !== 'Z') return null;
  if (!location) return null;
  const floor = location.floors.find((f) => f.id === selectedFloorId) ?? location.floors[0];
  if (!floor) return null;

  // Prefer the editing snapshot if it matches this floor — gives live preview as
  // the user drags handles in the editor.
  const isEditingThis =
    editingLayout && editingLayout.locationId === location.id && editingLayout.floorId === floor.id;
  const source = isEditingThis ? editingLayout : floor.layout;
  if (!source) return null;
  const { crop } = source;

  // Show the crop outline whenever a crop exists, EXCEPT while the user is
  // actively editing it (the PolygonDrawer renders its own visualization).
  const showCropOutline =
    !!crop &&
    !(isEditingThis && editingLayout?.mode === 'crop');

  const cropOutlineData: FeatureCollection<Polygon> = crop
    ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: crop }] }
    : { type: 'FeatureCollection', features: [] };

  // The image itself is rendered by FloorplanDOMOverlay (sibling in proto-body)
  // because Mapbox raster sources can't be geometrically clipped — we use a
  // DOM <img> with CSS clip-path instead. This component only renders the
  // crop-boundary outline in GL space when the image is clipped.
  if (!showCropOutline) return null;

  return (
    <Source id={`crop-outline-${location.id}-${floor.id}`} type="geojson" data={cropOutlineData}>
      <Layer
        id={`crop-outline-${location.id}-${floor.id}-line`}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#22c55e',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.6,
        }}
      />
    </Source>
  );
}
