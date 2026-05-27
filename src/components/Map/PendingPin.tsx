interface PendingPinProps {
  /** Hover state from the locations flyout — adds an accent halo. */
  highlighted?: boolean;
  /** Address-picked but not yet saved — pin pulses to read as preview. */
  preview?: boolean;
}

/**
 * Accent-blue teardrop pin for un-configured locations. No counts, no donut.
 * Anchor is the tip at the bottom (so the marker pins to the lng/lat exactly).
 */
export function PendingPin({ highlighted = false, preview = false }: PendingPinProps) {
  const cls = ['pending-pin', highlighted && 'is-hover', preview && 'is-preview'].filter(Boolean).join(' ');
  return (
    <svg
      className={cls}
      width="30"
      height="40"
      viewBox="0 0 30 40"
      // Anchor the tip (x=15, y=40) to the marker coordinate.
      style={{ transform: 'translateY(-20px)' }}
    >
      <circle cx="15" cy="15" r="14" className="pin-ring" />
      <path
        className="pin-body"
        d="M15 0 C7 0 1 6 1 14 C1 22 15 39 15 39 C15 39 29 22 29 14 C29 6 23 0 15 0 Z"
      />
      <circle cx="15" cy="14" r="4.5" className="pin-dot" />
    </svg>
  );
}
