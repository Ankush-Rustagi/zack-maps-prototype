import { useEffect, useRef, useState } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { FeatureCollection, LineString, Point as GeoPoint, Polygon } from 'geojson';

interface Props {
  /** Existing polygon (for editing) or null to start fresh. */
  value: Polygon | null;
  /** Called whenever the polygon changes (during drawing, after edits). */
  onChange: (polygon: Polygon | null) => void;
  /** Accent color for the visualization. */
  color: string;
  /** Unique id prefix to avoid clashes with other drawers. */
  idPrefix: string;
}

/**
 * Lightweight polygon drawer that works with Mapbox GL JS by listening to
 * raw map.on('click') events. Replaces @mapbox/mapbox-gl-draw which wasn't
 * receiving clicks in this app (likely due to event-handling quirks with
 * Mapbox GL JS v3 + our overlay stack).
 *
 * Behavior:
 *   - If no polygon exists: drawing mode. Click to add vertex; double-click
 *     or click first vertex to close. Esc cancels (clears).
 *   - If polygon exists: edit mode. Drag vertices to move; double-click a
 *     vertex to remove. Double-click an edge midpoint to insert.
 *
 * Rendering:
 *   - Closed polygon: fill + dashed outline.
 *   - In-progress: line from each vertex + dashed segment to cursor.
 *   - Vertices: filled circles with white halo.
 *   - Midpoints (during edit): small dots between vertices.
 *
 * Mounts as a child of <Map>.
 */
export function PolygonDrawer({ value, onChange, color, idPrefix }: Props) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  // Vertex list (without the closing duplicate). When we have a value, seed from it.
  const [vertices, setVertices] = useState<[number, number][]>(() =>
    value ? (value.coordinates[0].slice(0, -1) as [number, number][]) : [],
  );
  // Cursor position during draw — shown as a phantom segment.
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  // Whether we're closed (polygon finalized). Re-derive from vertex count + value.
  const closed = !!value && vertices.length >= 3;
  // Drag state during edit mode.
  const dragRef = useRef<{ vertexIdx: number } | null>(null);

  // Keep our state in sync if the value prop changes externally
  // (e.g. "Use perimeter" button injects a polygon).
  useEffect(() => {
    if (value) {
      const next = value.coordinates[0].slice(0, -1) as [number, number][];
      setVertices(next);
      setCursor(null);
    } else {
      setVertices([]);
      setCursor(null);
    }
  }, [value]);

  /* Click + mousemove + dblclick handlers. */
  useEffect(() => {
    if (!map) return;

    function onClick(e: mapboxgl.MapMouseEvent) {
      // If a drag just happened, swallow the click.
      if (dragRef.current) { dragRef.current = null; return; }

      if (closed) return; // Edit mode: clicks are no-ops (drag vertices instead).
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Click on first vertex closes the polygon.
      if (vertices.length >= 3) {
        const first = vertices[0];
        const firstPx = map!.project(first as [number, number]);
        const dx = e.point.x - firstPx.x;
        const dy = e.point.y - firstPx.y;
        if (Math.sqrt(dx * dx + dy * dy) < 12) {
          finalize();
          return;
        }
      }
      setVertices((vs) => [...vs, pt]);
    }

    function onMove(e: mapboxgl.MapMouseEvent) {
      if (closed) return;
      if (vertices.length === 0) return;
      setCursor([e.lngLat.lng, e.lngLat.lat]);
    }

    function onDblClick(e: mapboxgl.MapMouseEvent) {
      if (closed) return;
      if (vertices.length < 3) return;
      e.preventDefault(); // prevent map zoom-in
      finalize();
    }

    function finalize() {
      if (vertices.length < 3) return;
      const ring: [number, number][] = [...vertices, vertices[0]];
      const poly: Polygon = { type: 'Polygon', coordinates: [ring] };
      onChange(poly);
      setCursor(null);
    }

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
      if (e.key === 'Escape' && !closed) {
        // Cancel in-progress draw — discard all vertices.
        setVertices([]);
        setCursor(null);
      }
    }

    map.on('click', onClick);
    map.on('mousemove', onMove);
    map.on('dblclick', onDblClick);
    document.addEventListener('keydown', onKey);
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
      map.off('dblclick', onDblClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [map, vertices, closed, onChange]);

  /* Vertex drag in edit mode — uses pointer capture on the canvas. */
  useEffect(() => {
    if (!map || !closed) return;
    const canvas = map.getCanvas();

    function vertexAt(clientX: number, clientY: number): number | null {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      for (let i = 0; i < vertices.length; i++) {
        const p = map!.project(vertices[i] as [number, number]);
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < 100) return i; // 10px hit radius
      }
      return null;
    }

    function onPointerDown(e: PointerEvent) {
      const idx = vertexAt(e.clientX, e.clientY);
      if (idx === null) return;
      e.stopPropagation();
      dragRef.current = { vertexIdx: idx };
      canvas.setPointerCapture(e.pointerId);
      // Disable map drag-pan while moving a vertex.
      map!.dragPan.disable();
    }
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const ll = map!.unproject([e.offsetX, e.offsetY]);
      const next = [...vertices];
      next[drag.vertexIdx] = [ll.lng, ll.lat];
      setVertices(next);
      const ring: [number, number][] = [...next, next[0]];
      onChange({ type: 'Polygon', coordinates: [ring] });
    }
    function onPointerUp(e: PointerEvent) {
      if (!dragRef.current) return;
      canvas.releasePointerCapture(e.pointerId);
      map!.dragPan.enable();
      // Leave dragRef set until the next click — onClick will swallow itself.
      setTimeout(() => { dragRef.current = null; }, 0);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [map, vertices, closed, onChange]);

  /* Build GeoJSON for the visualization. */
  const lineFeatures: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: vertices.length === 0 ? [] : [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: closed
          ? [...vertices, vertices[0]] // closed loop
          : (cursor ? [...vertices, cursor] : vertices),
      },
    }],
  };
  const fillFeatures: FeatureCollection<Polygon> = closed
    ? {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] },
        }],
      }
    : { type: 'FeatureCollection', features: [] };
  const vertexFeatures: FeatureCollection<GeoPoint> = {
    type: 'FeatureCollection',
    features: vertices.map((v, i) => ({
      type: 'Feature',
      properties: { idx: i },
      geometry: { type: 'Point', coordinates: v },
    })),
  };

  return (
    <>
      {/* Filled polygon (only when closed) */}
      <Source id={`${idPrefix}-fill`} type="geojson" data={fillFeatures}>
        <Layer
          id={`${idPrefix}-fill-layer`}
          type="fill"
          paint={{ 'fill-color': color, 'fill-opacity': 0.10 }}
        />
      </Source>

      {/* Lines connecting vertices (closed loop or in-progress trail) */}
      <Source id={`${idPrefix}-line`} type="geojson" data={lineFeatures}>
        <Layer
          id={`${idPrefix}-line-layer`}
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': color,
            'line-width': 2.5,
            'line-dasharray': [1.5, 1.5],
          }}
        />
      </Source>

      {/* Vertex dots */}
      <Source id={`${idPrefix}-vertices`} type="geojson" data={vertexFeatures}>
        <Layer
          id={`${idPrefix}-vertex-halo`}
          type="circle"
          paint={{ 'circle-radius': 6, 'circle-color': '#ffffff' }}
        />
        <Layer
          id={`${idPrefix}-vertex-dot`}
          type="circle"
          paint={{ 'circle-radius': 4, 'circle-color': color }}
        />
      </Source>
    </>
  );
}
