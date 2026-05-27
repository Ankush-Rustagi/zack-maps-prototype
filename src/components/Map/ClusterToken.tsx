interface Props {
  /** Total devices in this cluster (sum across aggregated locations). */
  total: number;
  /** Devices online — drives the green portion of the donut ring. */
  online: number;
  /** When > 1, render with the aggregated-cluster halo. */
  pointCount?: number;
  /** Hover state from the locations flyout. */
  highlighted?: boolean;
}

/**
 * Donut-ring token rendered as a pure SVG. Two arcs (online green, offline amber)
 * make up the ring; the center shows the device count. Aggregated clusters get
 * a subtle outer halo so they read as "multiple locations".
 */
export function ClusterToken({ total, online, pointCount = 1, highlighted = false }: Props) {
  const isAggregate = pointCount > 1;
  const isEmpty = total === 0;
  const cls = [
    'cluster-token',
    isAggregate && 'aggregate',
    highlighted && 'is-hover',
    isEmpty && 'is-empty',
  ].filter(Boolean).join(' ');
  // Inner ring radius. SVG viewBox is 50x50, center at (25,25).
  const r = 18;
  const c = 2 * Math.PI * r;
  const onlinePct = total > 0 ? online / total : 0;
  const onlineLen = c * onlinePct;
  const offlineLen = c - onlineLen;

  return (
    <svg className={cls} viewBox="0 0 50 50">
      {isAggregate && <circle cx="25" cy="25" r="23" className="ct-halo" />}
      {/* Background disc */}
      <circle cx="25" cy="25" r="18" className="ct-bg" />
      {/* Ghost ring — always drawn, visible only when total = 0 (no devices yet). */}
      <circle
        cx="25" cy="25" r={r}
        fill="none"
        strokeWidth="4"
        className="ct-ring-ghost"
      />
      {/* Offline portion drawn first (so online overlays it cleanly) */}
      {!isEmpty && (
        <circle
          cx="25" cy="25" r={r}
          fill="none"
          strokeWidth="4"
          className="ct-ring-off"
          strokeDasharray={`${offlineLen} ${c}`}
          strokeDashoffset={-onlineLen}
          transform="rotate(-90 25 25)"
        />
      )}
      {/* Online portion */}
      {!isEmpty && (
        <circle
          cx="25" cy="25" r={r}
          fill="none"
          strokeWidth="4"
          className="ct-ring-on"
          strokeDasharray={`${onlineLen} ${c}`}
          strokeDashoffset="0"
          transform="rotate(-90 25 25)"
        />
      )}
      <text x="25" y="25" className="ct-count">{total}</text>
    </svg>
  );
}
