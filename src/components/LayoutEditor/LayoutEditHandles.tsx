import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { useStore } from '../../store';
import {
  projectCorners,
  centerOf,
  translateCorners,
  rotateCorners,
  scaleCorners,
  rotationOf,
  distance,
} from '../../data/layoutMath';
import type { ScreenPt } from '../../data/layoutMath';

type DragKind =
  | { kind: 'translate'; startMouseX: number; startMouseY: number }
  | { kind: 'rotate'; startAngle: number; startMouseAngle: number }
  | { kind: 'scale'; cornerIdx: number; startDistance: number };

/**
 * SVG overlay sitting full-screen on top of the map. Reads editingLayout's
 * 4 corners, projects them to screen pixels each render, and draws:
 *   - a dashed quad with a translucent fill (drag = translate)
 *   - 4 corner squares (drag = uniform scale from center)
 *   - a stem above the top edge ending in a knob (drag = rotate around center)
 *
 * Handles re-render on every animation frame so they stay attached to the
 * image as the user pans/zooms the underlying Mapbox map.
 */
/**
 * Rendered as a child of <Map> so useMap() resolves to the active Mapbox
 * instance. The SVG is portaled into the body to escape the Map container's
 * own click handlers (Mapbox can intercept events inside its canvas).
 */
export function LayoutEditHandles() {
  const editing = useStore((s) => s.editingLayout);
  const update = useStore((s) => s.updateEditingLayout);
  const maps = useMap();
  // Resolve our named map (set via <Map id="main">). Fall back to `current` if
  // the handles ever get nested under <Map> directly.
  const mapRef = maps.main ?? maps.current;
  const map = mapRef?.getMap();

  // Force re-render when the map moves (so projected screen positions follow).
  const [, setFrame] = useState(0);
  useEffect(() => {
    if (!map) return;
    const bump = () => setFrame((n) => n + 1);
    map.on('move', bump);
    map.on('zoom', bump);
    map.on('rotate', bump);
    return () => {
      map.off('move', bump);
      map.off('zoom', bump);
      map.off('rotate', bump);
    };
  }, [map, editing?.locationId, editing?.floorId]);

  const dragRef = useRef<DragKind | null>(null);
  const lastCornersRef = useRef(editing?.corners);
  // Keep dragRef's snapshot of corners in sync with store updates between events.
  useEffect(() => { lastCornersRef.current = editing?.corners; }, [editing?.corners]);

  if (!editing || !map) return null;
  // Image is locked during Crop sub-mode — handles disappear.
  if (editing.mode !== 'position') return null;

  const pts: ScreenPt[] = projectCorners(map, editing.corners);
  const c = centerOf(pts);
  const angleDeg = rotationOf(pts);

  // Rotation stem: extends 30px from top-edge midpoint, perpendicular to top edge.
  const topMid: ScreenPt = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  const rad = (angleDeg * Math.PI) / 180;
  const stemEnd: ScreenPt = {
    x: topMid.x + Math.sin(rad) * 30,
    y: topMid.y - Math.cos(rad) * 30,
  };

  function startDrag(e: React.PointerEvent<SVGElement>, drag: DragKind) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = drag;
  }

  function onPointerMove(e: React.PointerEvent<SVGElement>) {
    const drag = dragRef.current;
    if (!drag || !map || !editing) return;
    const corners = lastCornersRef.current ?? editing.corners;

    if (!map) return;
    if (drag.kind === 'translate') {
      const dx = e.clientX - drag.startMouseX;
      const dy = e.clientY - drag.startMouseY;
      const next = translateCorners(map, corners, dx, dy);
      lastCornersRef.current = next;
      update({ corners: next });
      // Reset start for incremental dragging so we don't accumulate error.
      dragRef.current = { kind: 'translate', startMouseX: e.clientX, startMouseY: e.clientY };
    } else if (drag.kind === 'rotate') {
      const currentPts = projectCorners(map, corners);
      const center = centerOf(currentPts);
      const mouseAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
      const deltaRad = mouseAngle - drag.startMouseAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const next = rotateCorners(map, corners, deltaDeg);
      lastCornersRef.current = next;
      update({ corners: next });
      dragRef.current = { kind: 'rotate', startAngle: drag.startAngle + deltaDeg, startMouseAngle: mouseAngle };
    } else if (drag.kind === 'scale') {
      const currentPts = projectCorners(map, corners);
      const center = centerOf(currentPts);
      const curDist = distance({ x: e.clientX, y: e.clientY }, center);
      const factor = curDist / drag.startDistance;
      if (Number.isFinite(factor) && factor > 0.05 && factor < 20) {
        const next = scaleCorners(map, corners, factor);
        lastCornersRef.current = next;
        update({ corners: next });
        dragRef.current = { kind: 'scale', cornerIdx: drag.cornerIdx, startDistance: curDist };
      }
    }
  }

  function endDrag() {
    dragRef.current = null;
  }

  // Build the quad path: M tl L tr L br L bl Z
  const pathD = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y} Z`;

  const w = window.innerWidth;
  const h = window.innerHeight;

  return (
    <svg
      className="layout-edit-handles"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <path
        className="handle-body"
        d={pathD}
        onPointerDown={(e) => startDrag(e, { kind: 'translate', startMouseX: e.clientX, startMouseY: e.clientY })}
      />

      {/* Rotation stem */}
      <line
        className="handle-stem"
        x1={topMid.x} y1={topMid.y}
        x2={stemEnd.x} y2={stemEnd.y}
      />
      <circle
        className="handle-stem-knob"
        cx={stemEnd.x} cy={stemEnd.y} r={7}
        onPointerDown={(e) => {
          const startMouseAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x);
          startDrag(e, { kind: 'rotate', startAngle: angleDeg, startMouseAngle });
        }}
      />

      {/* Corner handles — uniform scale from center */}
      {pts.map((p, i) => (
        <rect
          key={i}
          className="handle-edge"
          x={p.x - 5} y={p.y - 5} width={10} height={10}
          onPointerDown={(e) => {
            const startDistance = distance({ x: e.clientX, y: e.clientY }, c);
            startDrag(e, { kind: 'scale', cornerIdx: i, startDistance });
          }}
        />
      ))}
    </svg>
  );
}
