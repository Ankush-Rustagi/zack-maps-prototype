import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { useStore, selectCurrentLocation } from '../../store';
import type { Polygon } from 'geojson';

/**
 * DOM-img floorplan overlay. Replaces the previous Mapbox raster image source
 * so we can use CSS clip-path for true geometric clipping by the crop polygon
 * (or location perimeter as a fallback).
 *
 * The image is positioned in screen space by projecting its 4 corners through
 * the live map, computing center / width / height / rotation, then applying
 * a CSS transform. Re-renders on every map move/zoom so it tracks the map.
 *
 * Stacking: the img sits inside .proto-body with z-index 1, below the regular
 * top-level chrome but above the Mapbox canvas + GL layers. Mapbox HTML
 * markers (cluster donuts, devices) are kept on top via a CSS rule so they
 * remain clickable.
 */
export function FloorplanDOMOverlay() {
  const curState = useStore((s) => s.curState);
  const location = useStore(selectCurrentLocation);
  const selectedFloorId = useStore((s) => s.selectedFloorId);
  const editingLayout = useStore((s) => s.editingLayout);
  const maps = useMap();
  const mapRef = maps.main ?? maps.current;
  const map = mapRef?.getMap();

  // Force re-render whenever the map moves/zooms.
  const [, setFrame] = useState(0);
  useEffect(() => {
    if (!map) return;
    const bump = () => setFrame((n) => n + 1);
    map.on('move', bump);
    map.on('zoom', bump);
    map.on('rotate', bump);
    map.on('resize', bump);
    return () => {
      map.off('move', bump);
      map.off('zoom', bump);
      map.off('rotate', bump);
      map.off('resize', bump);
    };
  }, [map]);

  if (curState !== 'V' && curState !== 'Z') return null;
  if (!location || !map) return null;
  const floor = location.floors.find((f) => f.id === selectedFloorId) ?? location.floors[0];
  if (!floor) return null;

  const isEditingThis =
    editingLayout && editingLayout.locationId === location.id && editingLayout.floorId === floor.id;
  const source = isEditingThis ? editingLayout : floor.layout;
  if (!source) return null;
  const { imageUrl, corners, opacity, crop } = source;

  // Effective clipping polygon. Precedence: editing-session crop > saved crop > perimeter.
  // While the user is actively drawing crop in Z, skip clipping so they can see the
  // full image to draw against.
  const skipClip = isEditingThis && editingLayout?.mode === 'crop';
  const clipPolygon: Polygon | null = skipClip
    ? null
    : (crop ?? location.perimeter ?? null);

  // Project the 4 corners to screen pixels and derive position/size/rotation.
  const pts = corners.map((c) => map.project(c as [number, number]));
  const cx = (pts[0].x + pts[2].x) / 2;
  const cy = (pts[0].y + pts[2].y) / 2;
  // Top edge length = width; left edge length = height.
  const w = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  const h = Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y);
  const angleRad = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);

  // Build clip-path from polygon in image-local coords.
  let clipPath: string | undefined;
  if (clipPolygon && w > 0 && h > 0) {
    // First ring (without closing duplicate) is the boundary.
    const ring = clipPolygon.coordinates[0];
    const cos = Math.cos(-angleRad);
    const sin = Math.sin(-angleRad);
    const pieces: string[] = [];
    for (const [lng, lat] of ring) {
      const p = map.project([lng, lat]);
      // Translate to img-center origin, un-rotate to align with img's local axes.
      const dx = p.x - cx;
      const dy = p.y - cy;
      const lx = dx * cos - dy * sin + w / 2;
      const ly = dx * sin + dy * cos + h / 2;
      // Express as percentages of img dimensions so CSS clip-path scales properly.
      const px = (lx / w) * 100;
      const py = (ly / h) * 100;
      pieces.push(`${px.toFixed(3)}% ${py.toFixed(3)}%`);
    }
    clipPath = `polygon(${pieces.join(', ')})`;
  }

  return (
    <div
      className="floorplan-dom-overlay"
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        transform: `rotate(${angleRad}rad)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        opacity,
        zIndex: 1,
        clipPath,
        WebkitClipPath: clipPath,
      }}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }}
      />
    </div>
  );
}
