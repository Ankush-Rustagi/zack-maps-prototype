import type { Map as MapboxMap } from 'mapbox-gl';
import type { FloorLayout } from './locations';

export type Corners = FloorLayout['corners'];
export type ScreenPt = { x: number; y: number };

/* All math happens in screen-pixel space and is converted back to lng/lat by
   re-projecting through the live map. That way the layout stays geographically
   pinned across map pan/zoom while the user edits in intuitive screen terms. */

export function projectCorners(map: MapboxMap, corners: Corners): ScreenPt[] {
  return corners.map((c) => {
    const p = map.project(c as [number, number]);
    return { x: p.x, y: p.y };
  });
}

export function unprojectPoints(map: MapboxMap, pts: ScreenPt[]): Corners {
  return pts.map((p) => {
    const ll = map.unproject([p.x, p.y]);
    return [ll.lng, ll.lat] as [number, number];
  }) as Corners;
}

/** Center of a corner box (average of opposite corners). */
export function centerOf(pts: ScreenPt[]): ScreenPt {
  return { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2 };
}

/** Translate all four corners by a screen-space delta. */
export function translateCorners(map: MapboxMap, corners: Corners, dx: number, dy: number): Corners {
  const pts = projectCorners(map, corners).map((p) => ({ x: p.x + dx, y: p.y + dy }));
  return unprojectPoints(map, pts);
}

/** Rotate the corner box around its center by `deltaDeg` degrees (CW positive). */
export function rotateCorners(map: MapboxMap, corners: Corners, deltaDeg: number): Corners {
  const pts = projectCorners(map, corners);
  const c = centerOf(pts);
  const rad = (deltaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotated = pts.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  });
  return unprojectPoints(map, rotated);
}

/**
 * Uniform scale around the center, by a factor. e.g. 1.05 = grow 5%.
 * Used when dragging a corner handle: the distance from center → drag point
 * divided by the distance at drag-start gives the factor.
 */
export function scaleCorners(map: MapboxMap, corners: Corners, factor: number): Corners {
  const pts = projectCorners(map, corners);
  const c = centerOf(pts);
  const scaled = pts.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor,
  }));
  return unprojectPoints(map, scaled);
}

/**
 * Top edge angle in degrees (CW from horizontal). Used to render the rotation
 * stem at the right angle and to compute rotation deltas during drag.
 */
export function rotationOf(pts: ScreenPt[]): number {
  // Top-left → top-right vector.
  const dx = pts[1].x - pts[0].x;
  const dy = pts[1].y - pts[0].y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Euclidean distance between two screen points. */
export function distance(a: ScreenPt, b: ScreenPt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
