import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/mapbox';
import type { FeatureCollection, Polygon } from 'geojson';
import { useStore } from '../../store';

/**
 * Read-only perimeter rendering.
 *   - In V: bold dashed accent outline + 8% fill for the selected location only.
 *   - In U: faint outline for all locations with a perimeter (visible at zoom ≥14).
 * Active perimeter being edited in X is hidden here — Mapbox-Draw renders it itself.
 */
export function PerimeterOverlay() {
  const curState = useStore((s) => s.curState);
  const locations = useStore((s) => s.locations);
  const selectedLocationId = useStore((s) => s.selectedLocationId);

  const hidden = curState === 'X' || curState === 'I' || curState === 'P';

  // In V, show only the selected location's perimeter (the user's focus).
  // In U / T / other read-only states, show every perimeter (subtle).
  const showSelectedOnly = curState === 'V' || curState === 'Z';

  const data = useMemo<FeatureCollection<Polygon>>(() => {
    const features = locations
      .filter((l) => l.perimeter)
      .filter((l) => !showSelectedOnly || l.id === selectedLocationId)
      .map((l) => ({
        type: 'Feature' as const,
        properties: { id: l.id },
        geometry: l.perimeter as Polygon,
      }));
    return { type: 'FeatureCollection', features };
  }, [locations, selectedLocationId, showSelectedOnly]);

  if (hidden || data.features.length === 0) return null;

  // Faint in overview (U/T), bold in detail (V/Z).
  const bold = showSelectedOnly;

  return (
    <Source id="perimeters" type="geojson" data={data}>
      <Layer
        id="perim-fill"
        type="fill"
        // Only show fills past zoom 14 in overview mode so the world doesn't get noisy.
        minzoom={bold ? 0 : 14}
        paint={{
          'fill-color': '#4a7af7',
          'fill-opacity': bold ? 0.08 : 0.05,
        }}
      />
      <Layer
        id="perim-line"
        type="line"
        minzoom={bold ? 0 : 13}
        paint={{
          'line-color': '#4a7af7',
          'line-width': bold ? 2 : 1.5,
          'line-dasharray': bold ? [3, 2] : [4, 3],
          'line-opacity': bold ? 0.85 : 0.5,
        }}
      />
    </Source>
  );
}
